import { twitchBadgeService } from '@app/services/twitch-badge-service';
import type { SanitisedBadgeSet } from '@app/services/twitch-badge-service';
import { twitchService } from '@app/services/twitch-service';
import type { getCurrentEmoteData } from '@app/store/chat/actions/channelLoad';
import type { UserStateTags } from '@app/types/chat/irc-tags/userstate';
import { findBadges } from '@app/utils/chat/findBadges';
import { logger } from '@app/utils/logger';

import { chatStore$ } from '../observables/chatStore';

const SHARED_CHAT_BADGE_CACHE_TTL_MS = 60 * 60 * 1000;

type TimedCacheEntry<T> = {
  value: T;
  expiresAt: number;
};

type SourceBadgeCache = Record<
  string,
  TimedCacheEntry<SanitisedBadgeSet | null>
>;
type ChannelBadgeCache = Record<string, TimedCacheEntry<SanitisedBadgeSet[]>>;

type ChatEmoteData = NonNullable<ReturnType<typeof getCurrentEmoteData>>;

const sharedChatSourceBadgePromises = new Map<
  string,
  Promise<SanitisedBadgeSet | null>
>();

const sharedChatChannelBadgePromises = new Map<
  string,
  Promise<SanitisedBadgeSet[]>
>();

function readSourceBadgesBucket(): SourceBadgeCache {
  return chatStore$.sharedChatBadgeCaches.sourceBadges.peek() ?? {};
}

function readChannelBadgesBucket(): ChannelBadgeCache {
  return chatStore$.sharedChatBadgeCaches.channelBadges.peek() ?? {};
}

function getSourceBadgeCacheValue(
  key: string,
): SanitisedBadgeSet | null | undefined {
  const entry = readSourceBadgesBucket()[key];
  if (!entry) {
    return undefined;
  }

  if (entry.expiresAt <= Date.now()) {
    const next = { ...readSourceBadgesBucket() };
    delete next[key];
    chatStore$.sharedChatBadgeCaches.sourceBadges.set(next);
    return undefined;
  }

  return entry.value;
}

function getChannelBadgesCacheValue(
  key: string,
): SanitisedBadgeSet[] | undefined {
  const entry = readChannelBadgesBucket()[key];
  if (!entry) {
    return undefined;
  }

  if (entry.expiresAt <= Date.now()) {
    const next = { ...readChannelBadgesBucket() };
    delete next[key];
    chatStore$.sharedChatBadgeCaches.channelBadges.set(next);
    return undefined;
  }

  return entry.value;
}

function setSourceBadgeCacheValue(
  key: string,
  value: SanitisedBadgeSet | null,
): void {
  chatStore$.sharedChatBadgeCaches.sourceBadges.set({
    ...readSourceBadgesBucket(),
    [key]: {
      value,
      expiresAt: Date.now() + SHARED_CHAT_BADGE_CACHE_TTL_MS,
    },
  });
}

function setChannelBadgesCacheValue(
  key: string,
  value: SanitisedBadgeSet[],
): void {
  chatStore$.sharedChatBadgeCaches.channelBadges.set({
    ...readChannelBadgesBucket(),
    [key]: {
      value,
      expiresAt: Date.now() + SHARED_CHAT_BADGE_CACHE_TTL_MS,
    },
  });
}

export function clearSharedChatBadgeCaches(): void {
  chatStore$.sharedChatBadgeCaches.set({
    sourceBadges: {},
    channelBadges: {},
  });
  sharedChatSourceBadgePromises.clear();
  sharedChatChannelBadgePromises.clear();
}

function getSharedChatSourceRoomId(
  userstate: UserStateTags,
): string | undefined {
  return userstate['source-room-id'] || undefined;
}

async function getSharedChatSourceBadge(
  sourceRoomId: string,
): Promise<SanitisedBadgeSet | null> {
  const cached = getSourceBadgeCacheValue(sourceRoomId);
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
      setSourceBadgeCacheValue(sourceRoomId, sourceBadge);
      sharedChatSourceBadgePromises.delete(sourceRoomId);
      return sourceBadge;
    });

  sharedChatSourceBadgePromises.set(sourceRoomId, promise);
  return promise;
}

async function getSharedChatChannelBadges(
  sourceRoomId: string,
): Promise<SanitisedBadgeSet[]> {
  const cached = getChannelBadgesCacheValue(sourceRoomId);
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
      setChannelBadgesCacheValue(sourceRoomId, sourceBadges);
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
  if (!sourceRoomId) {
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
  if (!sourceRoomId) {
    return null;
  }

  const sourceBadge = getSourceBadgeCacheValue(sourceRoomId);
  const sourceChannelBadges = getChannelBadgesCacheValue(sourceRoomId);

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
    chatterinoBadges: emoteData.chatterinoBadges,
    chatUsers: [],
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
