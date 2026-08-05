import { scanChatBody } from '@app/utils/chat/deriveChatBody/scanChatBody';
import type {
  ChatBodyScan,
  ChatBodyVariant,
  MessageStructure,
} from '@app/utils/chat/deriveChatBody/types';
import type { ParsedPart } from '@app/utils/chat/parsedPart';

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

function resolveChatBodyVariant(
  flags: DeriveChatBodyFlags,
  notices: ChatBodyScan,
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
