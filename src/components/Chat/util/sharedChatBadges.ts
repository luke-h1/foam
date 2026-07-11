import { twitchBadgeService } from '@app/services/twitch-badge-service';
import { twitchService } from '@app/services/twitch-service';
import type { getCurrentEmoteData } from '@app/store/chat/actions/channelLoad';
import { getPreferences } from '@app/store/preferenceStore';
import type { UserStateTags } from '@app/types/chat/irc-tags/userstate';
import type { SanitisedBadgeSet } from '@app/types/twitch/badge';
import { findBadges } from '@app/utils/chat/findBadges';
import { logger } from '@app/utils/logger';

const SHARED_CHAT_BADGE_CACHE_TTL = 60 * 60 * 1000;

type TimedCacheEntry<T> = {
  value: T;
  expiresAt: number;
};

const sharedChatSourceBadgeCache = new Map<
  string,
  TimedCacheEntry<SanitisedBadgeSet | null>
>();
const sharedChatSourceBadgePromises = new Map<
  string,
  Promise<SanitisedBadgeSet | null>
>();
const sharedChatChannelBadgesCache = new Map<
  string,
  TimedCacheEntry<SanitisedBadgeSet[]>
>();
const sharedChatChannelBadgePromises = new Map<
  string,
  Promise<SanitisedBadgeSet[]>
>();

type ChatEmoteData = NonNullable<ReturnType<typeof getCurrentEmoteData>>;

function getTimedCacheValue<T>(
  cache: Map<string, TimedCacheEntry<T>>,
  key: string,
): T | undefined {
  const cached = cache.get(key);
  if (!cached) {
    return undefined;
  }

  if (cached.expiresAt <= Date.now()) {
    cache.delete(key);
    return undefined;
  }

  return cached.value;
}

function setTimedCacheValue<T>(
  cache: Map<string, TimedCacheEntry<T>>,
  key: string,
  value: T,
): void {
  // Sweep expired entries on insert: reads only evict the key they touch, so
  // source rooms never looked up again would otherwise keep their entries
  // (profile-image badge objects) for the app's lifetime. Inserts are rare
  // (one per newly seen shared-chat partner), so the full sweep is cheap.
  const now = Date.now();
  cache.forEach((entry, entryKey) => {
    if (entry.expiresAt <= now) {
      cache.delete(entryKey);
    }
  });
  cache.set(key, {
    value,
    expiresAt: now + SHARED_CHAT_BADGE_CACHE_TTL,
  });
}

function getSharedChatSourceRoomId(
  userstate: UserStateTags,
): string | undefined {
  const sourceRoomId = userstate['source-room-id'];
  if (!sourceRoomId) {
    return undefined;
  }

  return sourceRoomId;
}

async function getSharedChatSourceBadge(
  sourceRoomId: string,
): Promise<SanitisedBadgeSet | null> {
  const cached = getTimedCacheValue(sharedChatSourceBadgeCache, sourceRoomId);
  if (cached !== undefined) {
    return cached;
  }

  const existingPromise = sharedChatSourceBadgePromises.get(sourceRoomId);
  if (existingPromise) {
    return existingPromise;
  }

  const promise = twitchService
    .getUser(undefined, sourceRoomId)
    .then(user => {
      if (!user || typeof user !== 'object' || !user.profile_image_url) {
        return null;
      }

      return {
        id: sourceRoomId,
        set: 'shared-chat-source',
        type: 'Twitch Shared Chat Source',
        title: `Shared chat: ${user.display_name || user.login}`,
        url: user.profile_image_url,
        owner_username: user.login,
      } satisfies SanitisedBadgeSet;
    })
    .catch(error => {
      logger.chat.warn('Failed to fetch shared chat source room:', error);
      return null;
    })
    .then(sourceBadge => {
      setTimedCacheValue(sharedChatSourceBadgeCache, sourceRoomId, sourceBadge);
      sharedChatSourceBadgePromises.delete(sourceRoomId);
      return sourceBadge;
    });

  sharedChatSourceBadgePromises.set(sourceRoomId, promise);
  return promise;
}

async function getSharedChatChannelBadges(
  sourceRoomId: string,
): Promise<SanitisedBadgeSet[]> {
  const cached = getTimedCacheValue(sharedChatChannelBadgesCache, sourceRoomId);
  if (cached) {
    return cached;
  }

  const existingPromise = sharedChatChannelBadgePromises.get(sourceRoomId);
  if (existingPromise) {
    return existingPromise;
  }

  const promise = twitchBadgeService
    .listSanitisedChannelBadges(sourceRoomId)
    .catch(error => {
      logger.chat.warn('Failed to fetch shared chat source badges:', error);
      return [];
    })
    .then(sourceBadges => {
      setTimedCacheValue(
        sharedChatChannelBadgesCache,
        sourceRoomId,
        sourceBadges,
      );
      sharedChatChannelBadgePromises.delete(sourceRoomId);
      return sourceBadges;
    });

  sharedChatChannelBadgePromises.set(sourceRoomId, promise);
  return promise;
}

export async function getSharedChatBadgeContext(
  userstate: UserStateTags,
): Promise<{
  sourceBadge: SanitisedBadgeSet | null;
  sourceChannelBadges: SanitisedBadgeSet[] | null;
}> {
  const sourceRoomId = getSharedChatSourceRoomId(userstate);
  if (!sourceRoomId || !getPreferences().sharedChatEnabled) {
    return {
      sourceBadge: null,
      sourceChannelBadges: null,
    };
  }

  const [sourceBadge, sourceChannelBadges] = await Promise.all([
    getSharedChatSourceBadge(sourceRoomId),
    getSharedChatChannelBadges(sourceRoomId),
  ]);

  return {
    sourceBadge,
    sourceChannelBadges,
  };
}

export function getCachedSharedChatBadgeContext(userstate: UserStateTags): {
  isComplete: boolean;
  sourceBadge: SanitisedBadgeSet | null | undefined;
  sourceChannelBadges: SanitisedBadgeSet[] | undefined;
} | null {
  const sourceRoomId = getSharedChatSourceRoomId(userstate);
  if (!sourceRoomId || !getPreferences().sharedChatEnabled) {
    return null;
  }

  const sourceBadge = getTimedCacheValue(
    sharedChatSourceBadgeCache,
    sourceRoomId,
  );
  const sourceChannelBadges = getTimedCacheValue(
    sharedChatChannelBadgesCache,
    sourceRoomId,
  );

  return {
    isComplete: sourceBadge !== undefined && sourceChannelBadges !== undefined,
    sourceBadge,
    sourceChannelBadges,
  };
}

export function getMessageBadges({
  emoteData,
  sourceBadge,
  sourceChannelBadges,
  userstate,
}: {
  emoteData: ChatEmoteData;
  sourceBadge?: SanitisedBadgeSet | null;
  sourceChannelBadges?: SanitisedBadgeSet[] | null;
  userstate: UserStateTags;
}): SanitisedBadgeSet[] {
  const foundBadges = findBadges({
    userstate,
    bttvBadges: emoteData.bttvBadges,
    chatterinoBadges: emoteData.chatterinoBadges,
    ffzChannelBadges: emoteData.ffzChannelBadges,
    ffzGlobalBadges: emoteData.ffzGlobalBadges,
    twitchChannelBadges: sourceChannelBadges ?? emoteData.twitchChannelBadges,
    twitchGlobalBadges: emoteData.twitchGlobalBadges,
  });

  if (!sourceBadge) {
    return foundBadges;
  }

  return [
    sourceBadge,
    ...foundBadges.filter(badge => badge.set !== sourceBadge.set),
  ];
}
