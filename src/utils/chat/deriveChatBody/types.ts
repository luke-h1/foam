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
  | 'mod_anniversary'
  | 'app_system_sender'
  | 'user_chat';

/**
 * The part types a single Text element can host, which lets a body wrap
 * inline after the username instead of dropping to a block on a new flex line.
 */
export type InlineFlowPart = ParsedPart<'text' | 'mention' | 'link' | 'emote'>;

export interface MessageStructure {
  /**
   * Every part fits in a single Text - ignores paint/moderation, which
   * `canFlowInline` ANDs in for the caller.
   */
  canBeInline: boolean;
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
