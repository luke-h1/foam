import { normaliseChatUsername } from '@app/utils/chat/chatUsernames/normaliseChatUsername';
import { emoteBreaksInline } from '@app/utils/chat/deriveChatBody/emoteBreaksInline';
import type { ChatBodyScan } from '@app/utils/chat/deriveChatBody/types';
import type { ParsedPart } from '@app/utils/chat/parsedPart';

const SUBSCRIPTION_NOTICE_TYPES = new Set<ParsedPart['type']>([
  'sub',
  'resub',
  'anongiftpaidupgrade',
  'anongift',
  'submysterygift',
  'giftpaidupgrade',
  'primepaidupgrade',
]);
const CHARITY_DONATION_TYPES = new Set<ParsedPart['type']>(['charitydonation']);
const RITUAL_NOTICE_TYPES = new Set<ParsedPart['type']>(['ritual']);
const STV_EMOTE_EVENT_TYPES = new Set<ParsedPart['type']>([
  'stv_emote_added',
  'stv_emote_removed',
]);
const VIEWER_MILESTONE_TYPES = new Set<ParsedPart['type']>(['viewermilestone']);

const scanCache = new WeakMap<ParsedPart[], ChatBodyScan>();

/**
 * The single pass over a message's parts. Everything the render path needs to
 * know about a body - whether it can flow inline, whether it holds emotes,
 * which notice it is, who it mentions - is decided here once per message and
 * cached, so no renderer re-walks the parts.
 */
export function scanChatBody(message: ParsedPart[]): ChatBodyScan {
  const cached = scanCache.get(message);
  if (cached) {
    return cached;
  }

  let canBeInline = true;
  let containsEmotes = false;
  let hasSubscriptionNotice = false;
  let hasStvEmoteEvent = false;
  let hasViewerMilestone = false;
  let hasCharityDonation = false;
  let hasRitualNotice = false;
  const mentionLogins: string[] = [];

  for (const part of message) {
    switch (part.type) {
      case 'text':
      case 'link':
        break;
      case 'mention': {
        const login = normaliseChatUsername(part.content);
        if (login) {
          mentionLogins.push(login);
        }
        break;
      }
      case 'emote':
        containsEmotes = true;
        if (emoteBreaksInline(part)) {
          canBeInline = false;
        }
        break;
      default:
        canBeInline = false;
        if (SUBSCRIPTION_NOTICE_TYPES.has(part.type)) {
          hasSubscriptionNotice = true;
        } else if (STV_EMOTE_EVENT_TYPES.has(part.type)) {
          hasStvEmoteEvent = true;
        } else if (VIEWER_MILESTONE_TYPES.has(part.type)) {
          hasViewerMilestone = true;
        } else if (CHARITY_DONATION_TYPES.has(part.type)) {
          hasCharityDonation = true;
        } else if (RITUAL_NOTICE_TYPES.has(part.type)) {
          hasRitualNotice = true;
        }
    }
  }

  const scan: ChatBodyScan = {
    canBeInline,
    containsEmotes,
    hasSubscriptionNotice,
    hasCharityDonation,
    hasRitualNotice,
    hasStvEmoteEvent,
    hasViewerMilestone,
    mentionLogins,
  };
  scanCache.set(message, scan);
  return scan;
}
