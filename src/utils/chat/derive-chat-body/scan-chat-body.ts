import { normaliseChatUsername } from '@app/utils/chat/chat-usernames/normalise-chat-username';
import { emoteBreaksInline } from '@app/utils/chat/derive-chat-body/emote-breaks-inline';
import type { ChatBodyScan } from '@app/utils/chat/derive-chat-body/types';
import type { MessageToken } from '@app/utils/chat/message-token';

const SUBSCRIPTION_NOTICE_TYPES = new Set<MessageToken['type']>([
  'sub',
  'resub',
  'anongiftpaidupgrade',
  'anongift',
  'submysterygift',
  'giftpaidupgrade',
  'primepaidupgrade',
]);

const CHARITY_DONATION_TYPES = new Set<MessageToken['type']>([
  'charitydonation',
]);

const RITUAL_NOTICE_TYPES = new Set<MessageToken['type']>(['ritual']);

const STV_EMOTE_EVENT_TYPES = new Set<MessageToken['type']>([
  'stvEmoteAdded',
  'stvEmoteRemoved',
]);

const VIEWER_MILESTONE_TYPES = new Set<MessageToken['type']>([
  'viewermilestone',
]);

const MOD_ANNIVERSARY_TYPES = new Set<MessageToken['type']>(['modiversary']);

const scanCache = new WeakMap<MessageToken[], ChatBodyScan>();

/**
 * The single pass over a message's tokens; everything the render path needs is
 * decided here once per message and cached, so no renderer re-walks the tokens.
 */
export function scanChatBody(message: MessageToken[]): ChatBodyScan {
  const cached = scanCache.get(message);

  if (cached) {
    return cached;
  }

  let fitsInOneText = true;
  let containsEmotes = false;
  let hasSubscriptionNotice = false;
  let hasStvEmoteEvent = false;
  let hasViewerMilestone = false;
  let hasModAnniversary = false;
  let hasCharityDonation = false;
  let hasRitualNotice = false;
  const mentionLogins: string[] = [];

  for (const token of message) {
    switch (token.type) {
      case 'text':
      case 'link':
        break;
      case 'mention': {
        const login = normaliseChatUsername(token.content);

        if (login) {
          mentionLogins.push(login);
        }

        break;
      }
      case 'emote':
        containsEmotes = true;
        if (emoteBreaksInline(token)) {
          fitsInOneText = false;
        }
        break;
      default:
        fitsInOneText = false;
        if (SUBSCRIPTION_NOTICE_TYPES.has(token.type)) {
          hasSubscriptionNotice = true;
        } else if (STV_EMOTE_EVENT_TYPES.has(token.type)) {
          hasStvEmoteEvent = true;
        } else if (VIEWER_MILESTONE_TYPES.has(token.type)) {
          hasViewerMilestone = true;
        } else if (MOD_ANNIVERSARY_TYPES.has(token.type)) {
          hasModAnniversary = true;
        } else if (CHARITY_DONATION_TYPES.has(token.type)) {
          hasCharityDonation = true;
        } else if (RITUAL_NOTICE_TYPES.has(token.type)) {
          hasRitualNotice = true;
        }
    }
  }

  const scan: ChatBodyScan = {
    fitsInOneText,
    containsEmotes,
    hasSubscriptionNotice,
    hasCharityDonation,
    hasRitualNotice,
    hasStvEmoteEvent,
    hasViewerMilestone,
    hasModAnniversary,
    mentionLogins,
  };

  scanCache.set(message, scan);
  return scan;
}
