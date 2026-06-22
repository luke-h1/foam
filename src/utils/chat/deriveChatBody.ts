import type { ParsedPart } from '@app/utils/chat/parsedPart';

export type ChatBodyVariant =
  | 'twitch_system_notice'
  | 'raid'
  | 'announcement'
  | 'subscription'
  | 'charity_donation'
  | 'ritual'
  | 'stv_emote_event'
  | 'viewer_milestone'
  | 'app_system_sender'
  | 'user_chat';

export interface MessageStructure {
  /**
   * Every part fits in a single Text (Twitch-web style inline wrap) — ignores
   * paint/moderation, which the caller ANDs in cheaply at render time.
   */
  canBeInline: boolean;
  containsEmotes: boolean;
}

export interface ChatBodyDerived extends MessageStructure {
  variant: ChatBodyVariant;
  hasSubscriptionNotice: boolean;
  /**
   * Normalised logins this message @-mentions; render compares against the
   * current user instead of re-scanning parts.
   */
  mentionLogins: string[];
}

interface DeriveChatBodyFlags {
  sender?: string;
  isTwitchSystemNotice?: boolean;
  isAnnouncement?: boolean;
}

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

interface ChatBodyScan extends MessageStructure {
  hasSubscriptionNotice: boolean;
  hasCharityDonation: boolean;
  hasRitualNotice: boolean;
  hasStvEmoteEvent: boolean;
  hasViewerMilestone: boolean;
  mentionLogins: string[];
}

const scanCache = new WeakMap<ParsedPart[], ChatBodyScan>();
const structureCache = new WeakMap<ParsedPart[], MessageStructure>();

function normaliseLogin(value?: string): string {
  return value?.trim().replace(/^@/, '').toLowerCase() ?? '';
}

export function getMessageStructure(message: ParsedPart[]): MessageStructure {
  const cached = structureCache.get(message);
  if (cached) {
    return cached;
  }

  let canBeInline = true;
  let containsEmotes = false;
  for (const part of message) {
    if (part.type === 'emote') {
      containsEmotes = true;
      if (part.zero_width) {
        canBeInline = false;
      }
    } else if (
      part.type !== 'text' &&
      part.type !== 'mention' &&
      part.type !== 'link'
    ) {
      canBeInline = false;
    }
  }

  const structure: MessageStructure = { canBeInline, containsEmotes };
  structureCache.set(message, structure);
  return structure;
}

function resolveChatBodyVariant(
  flags: DeriveChatBodyFlags,
  notices: {
    hasSubscriptionNotice: boolean;
    hasCharityDonation: boolean;
    hasRitualNotice: boolean;
    hasStvEmoteEvent: boolean;
    hasViewerMilestone: boolean;
  },
): ChatBodyVariant {
  if (flags.isAnnouncement) {
    return 'announcement';
  }
  if (flags.isTwitchSystemNotice) {
    return 'twitch_system_notice';
  }
  if (notices.hasSubscriptionNotice) {
    return 'subscription';
  }
  if (notices.hasCharityDonation) {
    return 'charity_donation';
  }
  if (notices.hasRitualNotice) {
    return 'ritual';
  }
  if (notices.hasStvEmoteEvent) {
    return 'stv_emote_event';
  }
  if (notices.hasViewerMilestone) {
    return 'viewer_milestone';
  }
  if (flags.sender?.toLowerCase() === 'system') {
    return 'app_system_sender';
  }
  return 'user_chat';
}

function scanChatBody(message: ParsedPart[]): ChatBodyScan {
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
        const login = normaliseLogin(part.content);
        if (login) {
          mentionLogins.push(login);
        }
        break;
      }
      case 'emote':
        containsEmotes = true;
        if (part.zero_width) {
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
  structureCache.set(message, { canBeInline, containsEmotes });
  return scan;
}

export function deriveChatBody(
  message: ParsedPart[],
  flags: DeriveChatBodyFlags = {},
): ChatBodyDerived {
  const scan = scanChatBody(message);

  return {
    canBeInline: scan.canBeInline,
    containsEmotes: scan.containsEmotes,
    hasSubscriptionNotice: scan.hasSubscriptionNotice,
    mentionLogins: scan.mentionLogins,
    variant: resolveChatBodyVariant(flags, scan),
  };
}
