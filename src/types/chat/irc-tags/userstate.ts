/**
 * ChatUserstate represents the user state from Twitch IRC messages
 * Based on Twitch IRC tag format - see https://dev.twitch.tv/docs/irc/tags/
 */
export interface UserStateTags {
  /** User's display name */
  'display-name'?: string;
  login?: string;
  username?: string;
  /** User's ID */
  'user-id'?: string;
  /** Message ID */
  id?: string;
  color?: string;

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
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
  'user-type'?: '' | 'admin' | 'global_mod' | 'staff';
  /** Whether user is a moderator */
  mod?: string;
  /** Whether user is a subscriber */
  subscriber?: string;
  /** Whether user is a turbo user */
  turbo?: string;
  /** Emote sets (comma-separated list of emote set IDs) */
  'emote-sets'?: string;
  /** Whether this is the user's first message in the channel */
  'first-msg'?: string;

  /**
   * Custom tags we're adding to the response to
   * support reply threads
   */
  'reply-parent-msg-id': string;
  'reply-parent-msg-body': string;
  'reply-parent-display-name': string;
  'reply-parent-user-login': string;
}
