import type { SanitisedBadgeSet } from '@app/services/twitch-badge-service';
import type { SanitisedEmote } from '@app/types/emote';

import type { AnyChatMessageType } from './messageHandlers';

type FetchUserCosmeticsOptions = {
  allowAfterInitialWindow?: boolean;
  retryMissingBadge?: boolean;
};

type HydrateVisibleSevenTvAssetsParams = {
  channelId: string;
  messages: AnyChatMessageType[];
  personalEmoteUsers: Set<string>;
  cosmeticUsers: Set<string>;
  getUserPersonalEmotes: (
    twitchUserId: string,
    channelId: string,
  ) => SanitisedEmote[];
  fetchUserPersonalEmotes: (
    twitchUserId: string,
    channelId: string,
  ) => Promise<SanitisedEmote[]>;
  getUserBadge: (twitchUserId: string) => SanitisedBadgeSet | undefined;
  fetchUserCosmetics: (
    twitchUserId: string,
    options?: FetchUserCosmeticsOptions,
  ) => Promise<void>;
  reprocessMessage: (message: AnyChatMessageType) => void | Promise<void>;
};

function canHydrateMessage(message: AnyChatMessageType): boolean {
  return message.sender !== 'System' && !('notice_tags' in message);
}

export async function hydrateVisibleSevenTvAssets({
  channelId,
  messages,
  personalEmoteUsers,
  cosmeticUsers,
  getUserPersonalEmotes,
  fetchUserPersonalEmotes,
  getUserBadge,
  fetchUserCosmetics,
  reprocessMessage,
}: HydrateVisibleSevenTvAssetsParams): Promise<void> {
  const pending: Promise<void>[] = [];

  messages.forEach(message => {
    const userId = message.userstate['user-id'];
    if (!userId || !canHydrateMessage(message)) {
      return;
    }

    const cachedPersonalEmotes = getUserPersonalEmotes(userId, channelId);
    const cachedBadge = getUserBadge(userId);

    if (cachedPersonalEmotes.length > 0 || cachedBadge) {
      pending.push(Promise.resolve(reprocessMessage(message)));
    }

    if (cachedPersonalEmotes.length === 0 && !personalEmoteUsers.has(userId)) {
      personalEmoteUsers.add(userId);
      pending.push(
        fetchUserPersonalEmotes(userId, channelId).then(emotes => {
          if (emotes.length > 0) {
            return reprocessMessage(message);
          }
          return undefined;
        }),
      );
    }

    if (!cachedBadge && !cosmeticUsers.has(userId)) {
      cosmeticUsers.add(userId);
      pending.push(
        fetchUserCosmetics(userId, {
          allowAfterInitialWindow: true,
          retryMissingBadge: true,
        }).then(() => {
          if (getUserBadge(userId)) {
            return reprocessMessage(message);
          }
          return undefined;
        }),
      );
    }
  });

  await Promise.all(pending);
}
