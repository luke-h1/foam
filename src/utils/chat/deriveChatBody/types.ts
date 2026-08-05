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

/**
 * The part types a single Text element can host, which is what lets a body
 * wrap inline after the username (Twitch-web style) instead of dropping to a
 * rectangular block on the next flex line.
 */
export type InlineFlowPart = ParsedPart<'text' | 'mention' | 'link' | 'emote'>;

export interface MessageStructure {
  /**
   * Every part fits in a single Text — ignores paint/moderation, which
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
  /**
   * Normalised logins this message @-mentions; render compares against the
   * current user instead of re-scanning parts.
   */
  mentionLogins: string[];
}
