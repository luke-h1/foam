import { Platform } from 'react-native';

import { shouldEnrichMessage } from '@app/store/chat/actions/messageEnrichment';
import type { MessageUpdateInput } from '@app/store/chat/actions/messages';
import type { AnyChatMessageType } from '@app/store/chat/types/constants';
import type { SanitisedEmote } from '@app/types/emote';
import type { SanitisedBadgeSet } from '@app/types/twitch/badge';
import { boundedSetAdd } from '@app/utils/object/boundedSetAdd';

type FetchUserCosmeticsOptions = {
  retryMissingBadge?: boolean;
};

type VisibleMessageUpdate = MessageUpdateInput | null | undefined;

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
  /**
   * Resolves the store update for one row without publishing it.
   */
  reprocessMessage: (
    message: AnyChatMessageType,
  ) => VisibleMessageUpdate | Promise<VisibleMessageUpdate>;
  /**
   * Commits a batch of resolved updates in one store write.
   */
  publishMessageUpdates: (updates: MessageUpdateInput[]) => void;
  /**
   * Return false to abort a pass after unmount / channel hop.
   */
  shouldContinue?: () => boolean;
};

const MAX_PERSONAL_EMOTE_FETCHES_PER_PASS = 3;
const MAX_COSMETIC_FETCHES_PER_PASS = Platform.OS === 'android' ? 8 : 16;
const REPROCESS_BATCH_SIZE = 6;
const REPROCESS_BATCH_DELAY_MS = 32;
const MAX_HYDRATED_MESSAGE_KEYS = 2000;
const MAX_VISIBLE_USER_GUARDS = 5000;

const waitBetweenReprocessBatches = () =>
  new Promise<void>(resolve => {
    setTimeout(resolve, REPROCESS_BATCH_DELAY_MS);
  });

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

function shouldAbort(shouldContinue?: () => boolean): boolean {
  return shouldContinue?.() === false;
}

const publishResolvedUpdates = (
  publishMessageUpdates: (updates: MessageUpdateInput[]) => void,
  resolved: VisibleMessageUpdate[],
) => {
  const updates = resolved.filter(
    (update): update is MessageUpdateInput => update != null,
  );
  if (updates.length > 0) {
    publishMessageUpdates(updates);
  }
};

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
  publishMessageUpdates,
  reprocessMessage,
  shouldContinue,
}: HydrateVisibleSevenTvAssetsParams): Promise<boolean> {
  const pending: Promise<void>[] = [];
  let personalEmoteFetchesStarted = 0;
  let cosmeticFetchesStarted = 0;
  let didScheduleReprocess = false;

  const reprocessIfChanged = (message: AnyChatMessageType) => {
    if (shouldAbort(shouldContinue)) {
      return undefined;
    }

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

  const cachedAssetMessages: AnyChatMessageType[] = [];

  for (const message of messages) {
    const userId = message.userstate['user-id'];
    if (!userId || !shouldEnrichMessage(message)) {
      continue;
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
      cachedAssetMessages.push(message);
    }

    if (
      hydratePersonalEmotes &&
      cachedPersonalEmotes.length === 0 &&
      !personalEmoteUsers.has(userId) &&
      personalEmoteFetchesStarted < MAX_PERSONAL_EMOTE_FETCHES_PER_PASS
    ) {
      personalEmoteFetchesStarted += 1;
      boundedSetAdd(personalEmoteUsers, userId, MAX_VISIBLE_USER_GUARDS);
      pending.push(
        fetchUserPersonalEmotes(userId, channelId).then(async emotes => {
          if (emotes && emotes.length > 0) {
            publishResolvedUpdates(publishMessageUpdates, [
              await reprocessIfChanged(message),
            ]);
          }
        }),
      );
    }

    if (
      hydrateCosmetics &&
      !cachedBadge &&
      !cosmeticUsers.has(userId) &&
      cosmeticFetchesStarted < MAX_COSMETIC_FETCHES_PER_PASS
    ) {
      cosmeticFetchesStarted += 1;
      boundedSetAdd(cosmeticUsers, userId, MAX_VISIBLE_USER_GUARDS);
      pending.push(
        fetchUserCosmetics(userId, {
          retryMissingBadge: true,
        }).then(async () => {
          if (getUserBadge(userId)) {
            publishResolvedUpdates(publishMessageUpdates, [
              await reprocessIfChanged(message),
            ]);
          }
        }),
      );
    }
  }

  for (
    let start = 0;
    start < cachedAssetMessages.length;
    start += REPROCESS_BATCH_SIZE
  ) {
    if (start > 0) {
      // Yield between batches so a full screenful does not parse in one tick.
      // eslint-disable-next-line react-doctor/async-await-in-loop
      await waitBetweenReprocessBatches();
    }
    if (shouldAbort(shouldContinue)) {
      break;
    }
    const batch = cachedAssetMessages.slice(
      start,
      start + REPROCESS_BATCH_SIZE,
    );
    // eslint-disable-next-line react-doctor/async-await-in-loop -- one commit per batch
    const resolved = await Promise.all(
      batch.map(message => reprocessIfChanged(message)),
    );
    publishResolvedUpdates(publishMessageUpdates, resolved);
  }

  await Promise.all(pending);

  return didScheduleReprocess;
}
