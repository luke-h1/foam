import type { MessageToken } from '@app/utils/chat/message-token';

export type ChatBodyVariant =
  | 'twitch_system_notice'
  | 'raid'
  | 'announcement'
  | 'subscription'
  | 'charity_donation'
  | 'ritual'
  | 'stv_emote_event'
  | 'viewer_milestone'
  | 'mod_anniversary'
  | 'app_system_sender'
  | 'user_chat';

/**
 * The token kinds a single Text element can host, which lets a body wrap
 * inline after the username instead of dropping to a block on a new flex line.
 */
export type InlineFlowToken = MessageToken<
  'text' | 'mention' | 'link' | 'emote'
>;

export interface MessageStructure {
  /**
   * Every token fits in a single Text. Ignores paint and moderation, which
   * `flowsInline` ANDs in for the caller.
   */
  fitsInOneText: boolean;
  containsEmotes: boolean;
}

export interface ChatBodyScan extends MessageStructure {
  hasSubscriptionNotice: boolean;
  hasCharityDonation: boolean;
  hasRitualNotice: boolean;
  hasStvEmoteEvent: boolean;
  hasViewerMilestone: boolean;
  hasModAnniversary: boolean;
  mentionLogins: string[];
}
