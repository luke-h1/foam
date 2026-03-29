/**
 * ChatUserstate represents the user state from Twitch IRC messages
 * Based on Twitch IRC tag format - see https://dev.twitch.tv/docs/irc/tags/
 */
export interface UserStateTags {
  'display-name'?: string;
  login?: string;
  username?: string;
  'user-id'?: string;
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
  'badges-raw'?: string;
  'user-type'?: '' | 'admin' | 'global_mod' | 'staff';
  mod?: string;
  subscriber?: string;
  turbo?: string;
  'emote-sets'?: string;
  'first-msg'?: string;

  'room-id'?: string;
  'custom-reward-id'?: string;
  'msg-param-custom-reward-title'?: string;
  'msg-param-reward-title'?: string;

  /**
   * Custom tags we're adding to the response to
   * support reply threads
   */
  'reply-parent-msg-id': string;
  'reply-parent-msg-body': string;
  'reply-parent-display-name': string;
  'reply-parent-user-login': string;
}
