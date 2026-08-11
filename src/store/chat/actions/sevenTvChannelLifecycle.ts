import { batch } from '@legendapp/state';

import {
  invalidateSevenTvUser,
  sevenTvService,
} from '@app/services/seventv-service';
import type { SanitisedEmote } from '@app/types/emote';
import { logger } from '@app/utils/logger';
import { getSevenTvSessionId } from '@app/utils/seventv/sevenTvSessionId';

import { chatStore$ } from '../observables/chatStore';

export const notify7TVPresence = async (
  twitchUserId: string | undefined,
  twitchChannelId: string,
  options: { passive: boolean } = { passive: true },
): Promise<void> => {
  if (!twitchUserId || !twitchChannelId) {
    return;
  }

  try {
    const sevenTvUserId = await sevenTvService.get7tvUserId(twitchUserId);
    if (!sevenTvUserId) {
      return;
    }
    await sevenTvService.sendPresence(twitchChannelId, sevenTvUserId, {
      passive: options.passive,
      sessionId: options.passive
        ? (getSevenTvSessionId() ?? undefined)
        : undefined,
    });
  } catch (error) {
    logger.stvWs.warn(`Failed to notify 7TV about presence: ${String(error)}`, {
      name: 'seven_tv_presence_warning',
      error,
      action: 'presence_notify_failed',
      channel_id: twitchChannelId,
      provider: 'seven_tv',
      resource_type: 'presence',
      screen: 'chat',
      twitch_user_id: twitchUserId,
    });
  }
};

// Session-lifetime per-channel bookkeeping maps stay bounded like every
// other per-key guard in the chat store; 100 channels comfortably exceeds a
// realistic session while capping marathon channel-hopping growth.
const MAX_TRACKED_CHANNEL_ENTRIES = 100;

function setBoundedChannelEntry<V>(
  map: Map<string, V>,
  channelId: string,
  value: V,
): void {
  if (!map.has(channelId) && map.size >= MAX_TRACKED_CHANNEL_ENTRIES) {
    const oldest = map.keys().next().value;
    if (oldest !== undefined) {
      map.delete(oldest);
    }
  }
  map.set(channelId, value);
}

// 7TV rebroadcasts entitlements to the whole channel on every active
// presence, so cap writes per channel the same way the official extension
// does.
const ACTIVE_PRESENCE_MIN_INTERVAL_MS = 10_000;
const lastActivePresenceAt = new Map<string, number>();

/**
 * Broadcast the user's presence to the channel when they chat, which makes
 * 7TV push this user's entitlements (paint/badge/personal emotes) to every
 * other client subscribed to the channel.
 */
export const notify7TVActivePresence = async (
  twitchUserId: string | undefined,
  twitchChannelId: string,
): Promise<void> => {
  if (!twitchUserId || !twitchChannelId) {
    return;
  }

  const lastSentAt = lastActivePresenceAt.get(twitchChannelId);
  if (lastSentAt && Date.now() - lastSentAt < ACTIVE_PRESENCE_MIN_INTERVAL_MS) {
    return;
  }
  setBoundedChannelEntry(lastActivePresenceAt, twitchChannelId, Date.now());

  await notify7TVPresence(twitchUserId, twitchChannelId, { passive: false });
};

export const getSevenTvEmoteSetId = (channelId?: string): string | null => {
  const targetChannelId = channelId ?? chatStore$.currentChannelId.peek();
  if (!targetChannelId) {
    return null;
  }
  const caches = chatStore$.persisted.channelCaches.peek();
  const cache = caches?.[targetChannelId];
  return cache?.sevenTvEmoteSetId ?? null;
};

// Guards the check-fetch-assign sequence below: rapid consecutive switches
// (or a replayed dispatch) race their fetches, and without this the slower
// fetch's assign would win, leaving the cache on a stale set.
const latestRequestedEmoteSetByChannel = new Map<string, string>();

/**
 * Swap the channel's active 7TV emote set after a live `user.update` says the
 * broadcaster switched sets - replaces the cached channel set wholesale
 * instead of waiting for the user to leave and re-enter the channel.
 */
export const switchSevenTvEmoteSet = async (
  channelId: string,
  newSetId: string,
): Promise<boolean> => {
  const channelCache = chatStore$.persisted.channelCaches[channelId];
  if (!channelCache?.peek()) {
    return false;
  }
  if (channelCache.peek()?.sevenTvEmoteSetId === newSetId) {
    return false;
  }

  setBoundedChannelEntry(latestRequestedEmoteSetByChannel, channelId, newSetId);

  // The cached 7TV user still points at the set being replaced, and the next
  // full load would resolve it back.
  invalidateSevenTvUser(channelId);

  try {
    // eslint-disable-next-line react-doctor/async-defer-await -- the guard below checks state that can only go stale DURING this await; reordering would defeat it
    const newEmotes = await sevenTvService.getSanitisedEmoteSet(newSetId);
    if (latestRequestedEmoteSetByChannel.get(channelId) !== newSetId) {
      return false;
    }
    const latest = channelCache.peek();
    if (!latest) {
      return false;
    }

    channelCache.assign({
      sevenTvEmoteSetId: newSetId,
      sevenTvChannelEmotes: newEmotes,
      lastUpdated: Date.now(),
    });

    logger.chat.info('Switched 7TV channel emote set', {
      name: 'seven_tv_emotes_info',
      action: 'emote_set_switched',
      channel_id: channelId,
      emote_count: newEmotes.length,
      provider: 'seven_tv',
      resource_type: 'emotes',
      scope: 'channel',
      screen: 'chat',
      seven_tv_emote_set_id: newSetId,
    });
    return true;
  } catch (error) {
    logger.chat.warn('Failed to switch 7TV channel emote set', {
      name: 'seven_tv_emotes_warning',
      error,
      action: 'emote_set_switch_failed',
      channel_id: channelId,
      provider: 'seven_tv',
      resource_type: 'emotes',
      scope: 'channel',
      screen: 'chat',
      seven_tv_emote_set_id: newSetId,
    });
    return false;
  }
};

export const updateSevenTvEmotes = (
  channelId: string,
  added: SanitisedEmote[],
  removed: SanitisedEmote[],
) => {
  const caches = chatStore$.persisted.channelCaches.peek();
  const cache = caches?.[channelId];

  if (!cache) {
    logger.chat.warn(
      `No channel cache found for ${channelId}, skipping emote update`,
    );
    return;
  }

  const currentEmotes = cache.sevenTvChannelEmotes ?? [];
  const addedById = new Map(added.map(emote => [emote.id, emote]));
  const removedIds = new Set(removed.map((r: SanitisedEmote) => r.id));
  const updatedEmotes: SanitisedEmote[] = [];

  currentEmotes.forEach((emote: SanitisedEmote) => {
    const replacement = addedById.get(emote.id);
    if (replacement) {
      updatedEmotes.push(replacement);
      addedById.delete(emote.id);
      return;
    }
    if (!removedIds.has(emote.id)) {
      updatedEmotes.push(emote);
    }
  });

  addedById.forEach(emote => {
    if (!removedIds.has(emote.id)) {
      updatedEmotes.push(emote);
    }
  });

  batch(() => {
    const channelCache = chatStore$.persisted.channelCaches[channelId];
    if (channelCache) {
      channelCache.sevenTvChannelEmotes.set(updatedEmotes);
      channelCache.lastUpdated.set(Date.now());
    }
  });
};
