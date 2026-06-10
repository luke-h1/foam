import type { SanitisedBadgeSet } from '@app/services/twitch-badge-service';
import type { SanitisedEmote } from '@app/types/emote';
import { getDisplayEmoteUrl } from '@app/utils/emote/getDisplayEmoteUrl';

import type { AnyChatMessageType } from './messageHandlers';

type FetchUserCosmeticsOptions = {
  allowAfterInitialWindow?: boolean;
  retryMissingBadge?: boolean;
};

type HydrateVisibleSevenTvAssetsParams = {
  channelId: string;
  messages: AnyChatMessageType[];
  hydratedMessageKeys: Set<string>;
  personalEmoteUsers: Set<string>;
  cosmeticUsers: Set<string>;
  disableEmoteAnimations: boolean;
  getUserPersonalEmotes: (
    twitchUserId: string,
    channelId: string,
  ) => SanitisedEmote[];
  fetchUserPersonalEmotes: (
    twitchUserId: string,
    channelId: string,
  ) => Promise<SanitisedEmote[]>;
  getUserBadge: (twitchUserId: string) => SanitisedBadgeSet | null;
  fetchUserCosmetics: (
    twitchUserId: string,
    options?: FetchUserCosmeticsOptions,
  ) => Promise<void>;
  hydratePersonalEmotes?: boolean;
  hydrateCosmetics?: boolean;
  warmVisibleImages?: (assets: {
    badgeUrls: string[];
    emoteUrls: string[];
  }) => void;
  reprocessMessage: (message: AnyChatMessageType) => void | Promise<void>;
};

const MAX_PERSONAL_EMOTE_FETCHES_PER_PASS = 3;
const MAX_COSMETIC_FETCHES_PER_PASS = 3;
const MAX_EMOTE_WARMUPS_PER_PASS = 36;
const MAX_BADGE_WARMUPS_PER_PASS = 18;

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

function addBoundedUrl(target: Set<string>, max: number, url?: string) {
  if (!url || target.size >= max) {
    return;
  }

  target.add(url);
}

export async function hydrateVisibleSevenTvAssets({
  channelId,
  messages,
  hydratedMessageKeys,
  personalEmoteUsers,
  cosmeticUsers,
  disableEmoteAnimations,
  getUserPersonalEmotes,
  fetchUserPersonalEmotes,
  getUserBadge,
  fetchUserCosmetics,
  hydratePersonalEmotes = true,
  hydrateCosmetics = true,
  warmVisibleImages,
  reprocessMessage,
}: HydrateVisibleSevenTvAssetsParams): Promise<boolean> {
  const pending: Promise<void>[] = [];
  const emoteWarmupUrls = new Set<string>();
  const badgeWarmupUrls = new Set<string>();
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

    hydratedMessageKeys.add(hydrationKey);
    didScheduleReprocess = true;
    return reprocessMessage(message);
  };

  messages.forEach(message => {
    const userId = message.userstate['user-id'];
    if (!userId || !canHydrateMessage(message)) {
      return;
    }

    message.badges.forEach(badge => {
      addBoundedUrl(badgeWarmupUrls, MAX_BADGE_WARMUPS_PER_PASS, badge.url);
    });
    message.message.forEach(part => {
      if (part.type !== 'emote') {
        return;
      }

      addBoundedUrl(
        emoteWarmupUrls,
        MAX_EMOTE_WARMUPS_PER_PASS,
        // Must mirror EmoteRenderer's URL choice or the warmup caches a
        // different variant than the row renders.
        getDisplayEmoteUrl({
          image_variants: part.image_variants,
          url: part.url,
          static_url: part.static_url,
          disableAnimations: disableEmoteAnimations,
          preferredScale: '2x',
        }),
      );
    });

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
        personalEmoteUsers.add(userId);
        pending.push(
          fetchUserPersonalEmotes(userId, channelId).then(emotes => {
            if (emotes.length > 0) {
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
        cosmeticUsers.add(userId);
        pending.push(
          fetchUserCosmetics(userId, {
            allowAfterInitialWindow: true,
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

  if (emoteWarmupUrls.size > 0 || badgeWarmupUrls.size > 0) {
    warmVisibleImages?.({
      badgeUrls: [...badgeWarmupUrls],
      emoteUrls: [...emoteWarmupUrls],
    });
  }

  await Promise.all(pending);

  return didScheduleReprocess;
}
