import type { AnyChatMessageType } from '@app/store/chat/types/constants';
import { getMessageStructure } from '@app/utils/chat/deriveChatBody/getMessageStructure';
import type { ParsedPart } from '@app/utils/chat/parsedPart';

/**
 * Weights are "one average character wide", never points. A bucket only has to
 * group rows of similar height; the list learns each bucket's real height from
 * the first row of that shape it measures, at the current width, density and
 * font scale.
 */
const EMOTE_WEIGHT = 4;
/**
 * A clip renders a MediaLinkCard on its own line, roughly two lines of body.
 */
const TWITCH_CLIP_WEIGHT = 70;
/**
 * A 7TV emote link renders the inline MediaLinkCard chip, a 28pt thumbnail and
 * a one-line title that can stretch to the full row.
 */
const STV_EMOTE_LINK_WEIGHT = 35;
const NOTICE_META_ROW_WEIGHT = 34;
const SUBSCRIPTION_DESCRIPTION_WEIGHT = 48;

/**
 * About a wrapped line apart at the low end where nearly every row sits,
 * widening down the tail so one copypasta cannot open a bucket of its own.
 */
const BUCKET_UPPER_BOUNDS = [30, 60, 100, 150, 220, 320, 460, 640];

const bucketCache = new WeakMap<AnyChatMessageType, string>();

function textLength(value: string | undefined): number {
  return value?.length ?? 0;
}

function getPartWeight(part: ParsedPart): number {
  switch (part.type) {
    case 'text':
    case 'link':
    case 'mention':
    case 'cheermote':
      return part.content.length;
    case 'emote':
      return EMOTE_WEIGHT;
    case 'twitchClip':
      return TWITCH_CLIP_WEIGHT;
    case 'stvEmote':
      return STV_EMOTE_LINK_WEIGHT;
    case 'sub':
    case 'resub':
    case 'anongift':
    case 'anongiftpaidupgrade':
    case 'submysterygift':
    case 'giftpaidupgrade':
    case 'primepaidupgrade':
      return (
        NOTICE_META_ROW_WEIGHT +
        SUBSCRIPTION_DESCRIPTION_WEIGHT +
        textLength(part.subscriptionEvent.displayName) +
        textLength(part.subscriptionEvent.message)
      );
    case 'viewermilestone':
    case 'modiversary':
      return (
        NOTICE_META_ROW_WEIGHT +
        textLength(part.systemMsg) +
        textLength(part.content)
      );
    case 'charitydonation':
      return (
        NOTICE_META_ROW_WEIGHT +
        textLength(part.displayName) +
        textLength(part.charityName) +
        textLength(part.systemMsg) +
        textLength(part.message)
      );
    case 'ritual':
      return (
        NOTICE_META_ROW_WEIGHT +
        textLength(part.displayName) +
        textLength(part.systemMsg) +
        textLength(part.message)
      );
    case 'stv_emote_added':
    case 'stv_emote_removed':
      return NOTICE_META_ROW_WEIGHT + textLength(part.stvEvents.data.name);
    default:
      return 0;
  }
}

/**
 * Reads the message only. Badges, paints and the rest of the cosmetics land
 * after the row is placed, and the list treats a row's type as fixed from that
 * point.
 */
export function getChatRowSizeBucket(item: AnyChatMessageType): string {
  const cached = bucketCache.get(item);
  if (cached !== undefined) {
    return cached;
  }

  let weight = item.userstate?.username?.length ?? 0;
  for (const part of item.message) {
    weight += getPartWeight(part);
  }

  const bounded = BUCKET_UPPER_BOUNDS.findIndex(bound => weight <= bound);
  const bucket = bounded === -1 ? BUCKET_UPPER_BOUNDS.length : bounded;
  const value = getMessageStructure(item.message).containsEmotes
    ? `w${bucket}e`
    : `w${bucket}`;
  bucketCache.set(item, value);

  return value;
}
