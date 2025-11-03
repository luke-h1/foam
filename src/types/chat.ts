/**
 * ChatUserstate represents the user state from Twitch IRC messages
 * Based on Twitch IRC tag format - see https://dev.twitch.tv/docs/irc/tags/
 */
export interface ChatUserstate {
  /** User's display name */
  'display-name'?: string;
  /** User's login name (lowercase) - also mapped to username for compatibility */
  login?: string;
  /** Username (same as login, lowercase) - for compatibility with tmi.js */
  username?: string;
  /** User's ID */
  'user-id'?: string;
  /** Message ID */
  id?: string;
  /** User's color (hex color code) */
  color?: string;
  /** Badges (parsed object) */
  badges?: {
    broadcaster?: string;
    moderator?: string;
    subscriber?: string;
    premium?: string;
    partner?: string;
    vip?: string;
    'bits-leader'?: string;
    bits?: string;
    [key: string]: string | undefined;
  };
  /** Raw badges string (format: "badge/version,badge/version") */
  'badges-raw'?: string;
  /** User type (empty, admin, global_mod, staff) */
  'user-type'?: string;
  /** Whether user is a moderator */
  mod?: string;
  /** Whether user is a subscriber */
  subscriber?: string;
  /** Whether user is a turbo user */
  turbo?: string;
  /** Emote sets (comma-separated list of emote set IDs) */
  'emote-sets'?: string;
  /** Additional IRC tags */
  [key: string]: string | { [key: string]: string } | undefined;
}
