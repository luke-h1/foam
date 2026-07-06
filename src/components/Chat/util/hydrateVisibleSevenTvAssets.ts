import type { SanitisedEmote } from '@app/types/emote';
import type { SanitisedBadgeSet } from '@app/types/twitch/badge';

import type { AnyChatMessageType } from './messageHandlers';

type FetchUserCosmeticsOptions = {
  retryMissingBadge?: boolean;
};

type HydrateVisibleSevenTvAssetsParams = {
  channelId: string;
  messages: AnyChatMessageType[];
  hydratedMessageKeys: Set<string>;
  personalEmoteUsers: Set<string>;
  cosmeticUsers: Set<string>;
  getUserPersonalEmotes: (
    twitchUserId: string,
    channelId: string,
  ) => SanitisedEmote[];
  fetchUserPersonalEmotes: (
    twitchUserId: string,
    channelId: string,
  ) => Promise<SanitisedEmote[] | null>;
  getUserBadge: (twitchUserId: string) => SanitisedBadgeSet | null;
  fetchUserCosmetics: (
    twitchUserId: string,
    options?: FetchUserCosmeticsOptions,
  ) => Promise<void>;
  hydratePersonalEmotes?: boolean;
  hydrateCosmetics?: boolean;
  reprocessMessage: (message: AnyChatMessageType) => void | Promise<void>;
};

const MAX_PERSONAL_EMOTE_FETCHES_PER_PASS = 3;
const MAX_COSMETIC_FETCHES_PER_PASS = 3;

// These dedup guards live in refs that persist for the whole channel session, so
// they must be bounded or they grow one entry per message / per chatter until the
// app is jettisoned (busy channels like caedrel churn tens of thousands over 20
// min). The hydration-key guard comfortably covers the visible window + trim
// headroom; the per-user guards are backed by sessionCosmeticsCache + MMKV, so
// evicting a long-departed chatter only means a cheap cache-hit refetch.
const MAX_HYDRATED_MESSAGE_KEYS = 2000;
const MAX_VISIBLE_USER_GUARDS = 5000;

/**
 * Insertion-ordered add with a FIFO cap: once the set is full, adding a new key
 * drops the oldest so the guard stays bounded without losing dedup for recent
 * (still on-screen) entries.
 */
function boundedSetAdd(set: Set<string>, key: string, max: number): void {
  set.add(key);
  if (set.size <= max) {
    return;
  }
  const oldest = set.values().next().value;
  if (oldest !== undefined) {
    set.delete(oldest);
  }
}

function canHydrateMessage(message: AnyChatMessageType): boolean {
  if (message.sender === 'System') {
    return false;
  }

  if (
    'notice_tags' in message &&
    message.notice_tags &&
    !message.isAnnouncement &&
    !message.isHighlightedMessage
  ) {
    return false;
  }

  return true;
}

function isMissingSharedChatSourceBadge(message: AnyChatMessageType): boolean {
  return Boolean(
    message.userstate['source-room-id'] &&
    !message.badges.some(badge => badge.set === 'shared-chat-source'),
  );
}

function getMessageKey(message: AnyChatMessageType): string {
  return `${message.message_id.trim()}_${message.message_nonce.trim()}`;
}

function getHydrationKey({
  badge,
  message,
  personalEmotes,
}: {
  badge?: SanitisedBadgeSet;
  message: AnyChatMessageType;
  personalEmotes: SanitisedEmote[];
}): string {
  return [
    getMessageKey(message),
    personalEmotes.map(emote => emote.id).join(','),
    badge?.id ?? '',
    badge?.url ?? '',
    isMissingSharedChatSourceBadge(message) ? 'missing-source-badge' : '',
  ].join('|');
}

export async function hydrateVisibleSevenTvAssets({
  channelId,
  messages,
  hydratedMessageKeys,
  personalEmoteUsers,
  cosmeticUsers,
  getUserPersonalEmotes,
  fetchUserPersonalEmotes,
  getUserBadge,
  fetchUserCosmetics,
  hydratePersonalEmotes = true,
  hydrateCosmetics = true,
  reprocessMessage,
}: HydrateVisibleSevenTvAssetsParams): Promise<boolean> {
  const pending: Promise<void>[] = [];
  let personalEmoteFetchesStarted = 0;
  let cosmeticFetchesStarted = 0;
  let didScheduleReprocess = false;

  const reprocessIfChanged = (message: AnyChatMessageType) => {
    const userId = message.userstate['user-id'];
    if (!userId) {
      return undefined;
    }

    const hydrationKey = getHydrationKey({
      badge: hydrateCosmetics ? (getUserBadge(userId) ?? undefined) : undefined,
      message,
      personalEmotes: hydratePersonalEmotes
        ? getUserPersonalEmotes(userId, channelId)
        : [],
    });
    if (hydratedMessageKeys.has(hydrationKey)) {
      return undefined;
    }

    boundedSetAdd(hydratedMessageKeys, hydrationKey, MAX_HYDRATED_MESSAGE_KEYS);
    didScheduleReprocess = true;
    return reprocessMessage(message);
  };

  messages.forEach(message => {
    const userId = message.userstate['user-id'];
    if (!userId || !canHydrateMessage(message)) {
      return;
    }

    const cachedPersonalEmotes = hydratePersonalEmotes
      ? getUserPersonalEmotes(userId, channelId)
      : [];
    const cachedBadge = hydrateCosmetics ? getUserBadge(userId) : null;

    if (
      cachedPersonalEmotes.length > 0 ||
      cachedBadge ||
      isMissingSharedChatSourceBadge(message)
    ) {
      pending.push(Promise.resolve(reprocessIfChanged(message)));
    }

    if (
      hydratePersonalEmotes &&
      cachedPersonalEmotes.length === 0 &&
      !personalEmoteUsers.has(userId)
    ) {
      if (personalEmoteFetchesStarted < MAX_PERSONAL_EMOTE_FETCHES_PER_PASS) {
        personalEmoteFetchesStarted += 1;
        boundedSetAdd(personalEmoteUsers, userId, MAX_VISIBLE_USER_GUARDS);
        pending.push(
          fetchUserPersonalEmotes(userId, channelId).then(emotes => {
            if (emotes && emotes.length > 0) {
              return reprocessIfChanged(message);
            }
            return undefined;
          }),
        );
      }
    }

    if (hydrateCosmetics && !cachedBadge && !cosmeticUsers.has(userId)) {
      if (cosmeticFetchesStarted < MAX_COSMETIC_FETCHES_PER_PASS) {
        cosmeticFetchesStarted += 1;
        boundedSetAdd(cosmeticUsers, userId, MAX_VISIBLE_USER_GUARDS);
        pending.push(
          fetchUserCosmetics(userId, {
            retryMissingBadge: true,
          }).then(() => {
            if (getUserBadge(userId)) {
              return reprocessIfChanged(message);
            }
            return undefined;
          }),
        );
      }
    }
  });

  await Promise.all(pending);

  return didScheduleReprocess;
}
