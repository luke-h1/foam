import { sevenTvService } from '@app/services/seventv-service';
import type { SanitisedEmote } from '@app/types/emote';
import { createFetchOnceGuard } from '@app/utils/async/fetchOnceGuard';
import { logger } from '@app/utils/logger';

import { invalidatePersonalEmotes } from './invalidation';

const personalEmotesGuard = createFetchOnceGuard();

const MAX_PERSONAL_EMOTE_CHANNELS = 20;

/**
 * Session cache of each sighted chatter's 7TV personal emote set, keyed by
 * channel then Twitch user id. Kept as a plain bounded Map rather than on the
 * persisted store: sets are refetched per session anyway, and routing every
 * chatter sighting through the persisted observable re-stringified the whole
 * multi-MB channel-cache table per write. Reads are imperative (ingest and
 * render); React consumers subscribe via `personalEmotesVersion`.
 */
const personalEmotesByChannel = new Map<
  string,
  Record<string, SanitisedEmote[]>
>();

const EMPTY_PERSONAL_EMOTES: Record<string, SanitisedEmote[]> = {};

export const getChannelPersonalEmotes = (
  channelId: string | null | undefined,
): Record<string, SanitisedEmote[]> =>
  (channelId ? personalEmotesByChannel.get(channelId) : undefined) ??
  EMPTY_PERSONAL_EMOTES;

/**
 * Drops one channel's sets and the fetch-once stamps of the users they
 * belonged to, so those users refetch instead of short-circuiting into the
 * emptied cache.
 */
export const clearChannelPersonalEmotes = (channelId: string): void => {
  const channelEmotes = personalEmotesByChannel.get(channelId);
  if (!channelEmotes) {
    return;
  }
  for (const twitchUserId of Object.keys(channelEmotes)) {
    personalEmotesGuard.clearKey(twitchUserId);
  }
  personalEmotesByChannel.delete(channelId);
  invalidatePersonalEmotes();
};

export const fetchUserPersonalEmotes = async (
  twitchUserId: string,
  channelId: string,
): Promise<SanitisedEmote[] | null> => {
  if (personalEmotesGuard.hasFetched(twitchUserId)) {
    return getChannelPersonalEmotes(channelId)[twitchUserId] || [];
  }

  const cached = getChannelPersonalEmotes(channelId)[twitchUserId];
  if (cached?.length) {
    personalEmotesGuard.markFetched(twitchUserId);
    return cached;
  }

  return personalEmotesGuard.run(twitchUserId, async ctx => {
    try {
      const personalEmotes =
        await sevenTvService.getPersonalEmoteSet(twitchUserId);
      ctx.markFetched();

      if (personalEmotes.length > 0 && ctx.stillCurrent()) {
        writePersonalEmotes(channelId, twitchUserId, personalEmotes);
      }
      return personalEmotes;
    } catch (error) {
      ctx.markFetched();
      logger.stv.warn(
        `Failed to fetch personal emotes for user ${twitchUserId}:`,
        {
          name: 'seven_tv_emotes_warning',
          error,
          action: 'personal_emotes_failed',
          channel_id: channelId,
          provider: 'seven_tv',
          resource_type: 'emotes',
          scope: 'personal',
          screen: 'chat',
          twitch_user_id: twitchUserId,
        },
      );
      return null;
    }
  });
};

function writePersonalEmotes(
  channelId: string,
  twitchUserId: string,
  personalEmotes: SanitisedEmote[],
): void {
  const channelEmotes = personalEmotesByChannel.get(channelId);
  const previousEmotes = channelEmotes?.[twitchUserId] ?? [];
  const emoteIdsChanged =
    previousEmotes.length !== personalEmotes.length ||
    personalEmotes.some(
      (emote, index) => emote.id !== previousEmotes[index]?.id,
    );
  if (!emoteIdsChanged && channelEmotes) {
    return;
  }
  if (
    !channelEmotes &&
    personalEmotesByChannel.size >= MAX_PERSONAL_EMOTE_CHANNELS
  ) {
    const oldest = personalEmotesByChannel.keys().next().value;
    if (oldest !== undefined) {
      personalEmotesByChannel.delete(oldest);
    }
  }
  personalEmotesByChannel.set(channelId, {
    ...channelEmotes,
    [twitchUserId]: personalEmotes,
  });
  if (emoteIdsChanged) {
    invalidatePersonalEmotes();
  }
}

export const getUserPersonalEmotes = (
  twitchUserId: string,
  channelId: string,
): SanitisedEmote[] => getChannelPersonalEmotes(channelId)[twitchUserId] || [];

export const clearPersonalEmotesCache = () => {
  personalEmotesGuard.clear();
  if (personalEmotesByChannel.size > 0) {
    personalEmotesByChannel.clear();
    invalidatePersonalEmotes();
  }
};

/**
 * Refetch a user's personal emote set, replacing whatever is cached — used
 * when a live event (EMOTE_SET entitlement or an emote_set.update for their
 * personal set) says the cached copy is stale. Unlike the fetch-once path
 * this also writes an empty result, so removals propagate.
 */
export const refreshUserPersonalEmotes = async (
  twitchUserId: string,
  channelId: string | null | undefined,
): Promise<void> => {
  if (!twitchUserId || !channelId) {
    return;
  }
  personalEmotesGuard.clearKey(twitchUserId);
  await personalEmotesGuard.run(twitchUserId, async ctx => {
    try {
      const personalEmotes =
        await sevenTvService.getPersonalEmoteSet(twitchUserId);
      ctx.markFetched();
      if (ctx.stillCurrent()) {
        writePersonalEmotes(channelId, twitchUserId, personalEmotes);
      }
    } catch (error) {
      ctx.markFetched();
      logger.stv.warn(
        `Failed to refresh personal emotes for user ${twitchUserId}:`,
        {
          name: 'seven_tv_emotes_warning',
          error,
          action: 'personal_emotes_refresh_failed',
          channel_id: channelId,
          provider: 'seven_tv',
          resource_type: 'emotes',
          scope: 'personal',
          screen: 'chat',
          twitch_user_id: twitchUserId,
        },
      );
    }
  });
};

/**
 * Find which cached chatter owns a personal emote set, by the set id stamped
 * on their cached emotes. Only users whose personal emotes we already hold
 * can match, which also bounds how much work a stray set update can cause.
 */
export const findPersonalEmoteSetOwner = (
  channelId: string | null | undefined,
  emoteSetId: string,
): string | null => {
  if (!channelId) {
    return null;
  }
  const personalEmotes = getChannelPersonalEmotes(channelId);
  for (const [twitchUserId, emotes] of Object.entries(personalEmotes)) {
    if (emotes.some(emote => getEmoteSetId(emote) === emoteSetId)) {
      return twitchUserId;
    }
  }
  return null;
};

function getEmoteSetId(emote: SanitisedEmote): string | undefined {
  return 'set_metadata' in emote ? emote.set_metadata?.setId : undefined;
}

/**
 * An EMOTE_SET entitlement announces which personal set a chatter is
 * entitled to. Only refresh users we have already hydrated whose cached set
 * differs — entering a busy channel fires one of these per active 7TV
 * chatter, and unhydrated users are picked up lazily by the visible-message
 * hydrate path instead.
 */
export const handlePersonalEmoteSetEntitlement = (
  twitchUserId: string,
  emoteSetId: string,
  channelId: string | null | undefined,
): void => {
  if (!twitchUserId || !emoteSetId || !channelId) {
    return;
  }
  if (!personalEmotesGuard.hasFetched(twitchUserId)) {
    return;
  }
  const cached = getUserPersonalEmotes(twitchUserId, channelId);
  if (cached.some(emote => getEmoteSetId(emote) === emoteSetId)) {
    return;
  }
  void refreshUserPersonalEmotes(twitchUserId, channelId);
};
