import { scanChatBody } from '@app/utils/chat/derive-chat-body/scan-chat-body';
import type {
  ChatBodyScan,
  ChatBodyVariant,
  MessageStructure,
} from '@app/utils/chat/derive-chat-body/types';
import type { MessageToken } from '@app/utils/chat/message-token';

export interface ChatBodyDerived extends MessageStructure {
  hasSubscriptionNotice: boolean;
  /**
   * Normalised logins this message @-mentions; render compares against the
   * current user instead of re-scanning tokens.
   */
  mentionLogins: string[];
  mentionsCurrentUser: boolean;
  variant: ChatBodyVariant;
}

export interface DeriveChatBodyFlags {
  /**
   * Already normalised by `normaliseChatUsername`, so it compares directly
   * against `mentionLogins`.
   */
  currentUsername?: string;
  isAnnouncement?: boolean;
  isTwitchSystemNotice?: boolean;
  sender?: string;
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

  if (notices.hasModAnniversary) {
    return 'mod_anniversary';
  }

  if (flags.sender?.toLowerCase() === 'system') {
    return 'app_system_sender';
  }

  return 'user_chat';
}

export function deriveChatBody(
  message: MessageToken[],
  flags: DeriveChatBodyFlags = {},
): ChatBodyDerived {
  const scan = scanChatBody(message);

  return {
    fitsInOneText: scan.fitsInOneText,
    containsEmotes: scan.containsEmotes,
    hasSubscriptionNotice: scan.hasSubscriptionNotice,
    mentionLogins: scan.mentionLogins,
    mentionsCurrentUser: flags.currentUsername
      ? scan.mentionLogins.includes(flags.currentUsername)
      : false,
    variant: resolveChatBodyVariant(flags, scan),
  };
}
