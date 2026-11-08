import { twitchBadgeService } from '@app/services/twitch-badge-service';
import { twitchService } from '@app/services/twitch-service';
import { getPreferences } from '@app/store/preference-store';
import type { UserStateTags } from '@app/types/chat/irc-tags/userstate';
import type { SanitisedBadgeSet } from '@app/types/twitch/badge';
import { createFetchOnceGuard } from '@app/utils/async/fetchOnceGuard';
import { getSharedChatSourceRoomId } from '@app/utils/chat/shared-chat-badges/getSharedChatSourceRoomId';
import {
  getTimedCacheValue,
  setTimedCacheValue,
} from '@app/utils/chat/shared-chat-badges/getTimedCacheValue';
import { sharedChatChannelBadgesCache } from '@app/utils/chat/shared-chat-badges/sharedChatChannelBadgesCache';
import { sharedChatSourceBadgeCache } from '@app/utils/chat/shared-chat-badges/sharedChatSourceBadgeCache';
import { logger } from '@app/utils/logger';

const SHARED_CHAT_BADGE_CACHE_TTL = 60 * 60 * 1000;
const MAX_SHARED_CHAT_BADGE_CACHE_ENTRIES = 100;

const sourceBadgeGuard = createFetchOnceGuard();
const channelBadgesGuard = createFetchOnceGuard();

async function fetchSharedChatSourceBadge(
  sourceRoomId: string,
): Promise<SanitisedBadgeSet | null> {
  try {
    const user = await twitchService.getUser(undefined, sourceRoomId);

    if (!user || !user.profile_image_url) {
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
  } catch (error) {
    logger.chat.warn('Failed to fetch shared chat source room:', error);
    return null;
  }
}

async function fetchSharedChatChannelBadges(
  sourceRoomId: string,
): Promise<SanitisedBadgeSet[]> {
  try {
    return await twitchBadgeService.listSanitisedChannelBadges(sourceRoomId);
  } catch (error) {
    logger.chat.warn('Failed to fetch shared chat source badges:', error);
    return [];
  }
}

async function getSharedChatSourceBadge(
  sourceRoomId: string,
): Promise<SanitisedBadgeSet | null> {
  const cached = getTimedCacheValue(sharedChatSourceBadgeCache, sourceRoomId);

  if (cached !== undefined) {
    return cached;
  }

  return sourceBadgeGuard.run(sourceRoomId, async () => {
    const sourceBadge = await fetchSharedChatSourceBadge(sourceRoomId);

    setTimedCacheValue(
      sharedChatSourceBadgeCache,
      sourceRoomId,
      sourceBadge,
      SHARED_CHAT_BADGE_CACHE_TTL,
      MAX_SHARED_CHAT_BADGE_CACHE_ENTRIES,
    );

    return sourceBadge;
  });
}

async function getSharedChatChannelBadges(
  sourceRoomId: string,
): Promise<SanitisedBadgeSet[]> {
  const cached = getTimedCacheValue(sharedChatChannelBadgesCache, sourceRoomId);

  if (cached) {
    return cached;
  }

  return channelBadgesGuard.run(sourceRoomId, async () => {
    const sourceBadges = await fetchSharedChatChannelBadges(sourceRoomId);

    setTimedCacheValue(
      sharedChatChannelBadgesCache,
      sourceRoomId,
      sourceBadges,
      SHARED_CHAT_BADGE_CACHE_TTL,
      MAX_SHARED_CHAT_BADGE_CACHE_ENTRIES,
    );

    return sourceBadges;
  });
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
