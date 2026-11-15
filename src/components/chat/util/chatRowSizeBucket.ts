import type { AnyChatMessageType } from '@app/types/chat/chatMessage';
import type { MessageToken } from '@app/types/chat/messageToken';
import { getMessageStructure } from '@app/utils/chat/derive-chat-body/getMessageStructure';
import { isSubscriptionNoticeToken } from '@app/utils/chat/subscription-notice-token-types';

/**
 * Weights are "one average character wide", never points; the list learns each
 * bucket's real height from the first measured row of that shape.
 */
const EMOTE_WEIGHT = 4;

const TWITCH_CLIP_WEIGHT = 70;

const STV_EMOTE_LINK_WEIGHT = 35;

const NOTICE_META_ROW_WEIGHT = 34;
const SUBSCRIPTION_DESCRIPTION_WEIGHT = 48;

const GIF_WEIGHT = 48;

const BUCKET_UPPER_BOUNDS = [30, 60, 100, 150, 220, 320, 460, 640];

const bucketCache = new WeakMap<AnyChatMessageType, string>();

function textLength(value: string | undefined): number {
  return value?.length ?? 0;
}

function getPartWeight(token: MessageToken): number {
  if (isSubscriptionNoticeToken(token)) {
    return (
      NOTICE_META_ROW_WEIGHT +
      SUBSCRIPTION_DESCRIPTION_WEIGHT +
      textLength(token.subscriptionEvent.displayName) +
      textLength(token.subscriptionEvent.message)
    );
  }

  switch (token.type) {
    case 'text':
    case 'link':
    case 'mention':
    case 'cheermote':
      return token.content.length;
    case 'emote':
      return EMOTE_WEIGHT;
    case 'twitchClip':
      return TWITCH_CLIP_WEIGHT;
    case 'stvEmoteLink':
      return STV_EMOTE_LINK_WEIGHT;
    case 'viewermilestone':
    case 'modiversary':
      return (
        NOTICE_META_ROW_WEIGHT +
        textLength(token.systemMsg) +
        textLength(token.content)
      );
    case 'charitydonation':
      return (
        NOTICE_META_ROW_WEIGHT +
        textLength(token.displayName) +
        textLength(token.charityName) +
        textLength(token.systemMsg) +
        textLength(token.message)
      );
    case 'ritual':
      return (
        NOTICE_META_ROW_WEIGHT +
        textLength(token.displayName) +
        textLength(token.systemMsg) +
        textLength(token.message)
      );
    case 'stvEmoteAdded':
    case 'stvEmoteRemoved':
      return NOTICE_META_ROW_WEIGHT + textLength(token.stvEvents.data.name);

    case 'gif':
      return GIF_WEIGHT;

    default:
      return 0;
  }
}

export function getChatRowSizeBucket(item: AnyChatMessageType): string {
  const cached = bucketCache.get(item);

  if (cached !== undefined) {
    return cached;
  }

  let weight = item.userstate?.username?.length ?? 0;

  for (const token of item.message) {
    weight += getPartWeight(token);
  }

  const bounded = BUCKET_UPPER_BOUNDS.findIndex(bound => weight <= bound);
  const bucket = bounded === -1 ? BUCKET_UPPER_BOUNDS.length : bounded;

  const value = getMessageStructure(item.message).containsEmotes
    ? `w${bucket}e`
    : `w${bucket}`;

  bucketCache.set(item, value);

  return value;
}
