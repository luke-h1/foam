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
