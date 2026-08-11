import { twitchBadgeService } from '@app/services/twitch-badge-service';
import { twitchService } from '@app/services/twitch-service';
import { getPreferences } from '@app/store/preferenceStore';
import type { UserStateTags } from '@app/types/chat/irc-tags/userstate';
import type { SanitisedBadgeSet } from '@app/types/twitch/badge';
import { logger } from '@app/utils/logger';

import { getSharedChatSourceRoomId } from './getSharedChatSourceRoomId';
import { getTimedCacheValue, setTimedCacheValue } from './getTimedCacheValue';
import { sharedChatChannelBadgesCache } from './sharedChatChannelBadgesCache';
import { sharedChatSourceBadgeCache } from './sharedChatSourceBadgeCache';

const SHARED_CHAT_BADGE_CACHE_TTL = 60 * 60 * 1000;
const MAX_SHARED_CHAT_BADGE_CACHE_ENTRIES = 100;

const sharedChatSourceBadgePromises = new Map<
  string,
  Promise<SanitisedBadgeSet | null>
>();
const sharedChatChannelBadgePromises = new Map<
  string,
  Promise<SanitisedBadgeSet[]>
>();

export function clearSharedChatBadgeCaches(): void {
  sharedChatSourceBadgeCache.clear();
  sharedChatChannelBadgesCache.clear();
  sharedChatSourceBadgePromises.clear();
  sharedChatChannelBadgePromises.clear();
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
        provider: 'twitch',
      } satisfies SanitisedBadgeSet;
    })
    .catch(error => {
      logger.chat.warn('Failed to fetch shared chat source room:', error);
      return null;
    })
    .then(sourceBadge => {
      setTimedCacheValue(
        sharedChatSourceBadgeCache,
        sourceRoomId,
        sourceBadge,
        SHARED_CHAT_BADGE_CACHE_TTL,
        MAX_SHARED_CHAT_BADGE_CACHE_ENTRIES,
      );
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
        SHARED_CHAT_BADGE_CACHE_TTL,
        MAX_SHARED_CHAT_BADGE_CACHE_ENTRIES,
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
