import type { EoptOptional } from '@app/types/eopt';

export interface UserStateTags {
  'display-name'?: EoptOptional<string>;
  login?: EoptOptional<string>;
  username?: EoptOptional<string>;
  'user-id'?: EoptOptional<string>;
  id?: EoptOptional<string>;
  color?: EoptOptional<string>;

  badges?: EoptOptional<{
    broadcaster?: EoptOptional<string>;
    moderator?: EoptOptional<string>;
    subscriber?: EoptOptional<string>;
    premium?: EoptOptional<string>;
    partner?: EoptOptional<string>;
    vip?: EoptOptional<string>;
    'bits-leader'?: EoptOptional<string>;
    bits?: EoptOptional<string>;
    [key: string]: string | undefined;
  }>;
  'badges-raw'?: EoptOptional<string>;
  'source-badge-info'?: EoptOptional<string>;
  'source-badges'?: EoptOptional<string>;
  'source-id'?: EoptOptional<string>;
  'source-msg-id'?: EoptOptional<string>;
  'source-room-id'?: EoptOptional<string>;
  'source-only'?: EoptOptional<string>;
  'user-type'?: EoptOptional<'' | 'admin' | 'global_mod' | 'staff'>;
  mod?: EoptOptional<string>;
  subscriber?: EoptOptional<string>;
  turbo?: EoptOptional<string>;
  bits?: EoptOptional<string>;
  emotes?: EoptOptional<string>;
  /**
   * Comma-separated GIF spans: `start-end|gif_id|url`. Positions are
   * zero-based code-point indices into the PRIVMSG body.
   */
  gifs?: EoptOptional<string>;
  'emote-sets'?: EoptOptional<string>;
  'first-msg'?: EoptOptional<string>;
  'returning-chatter'?: EoptOptional<string>;

  'room-id'?: EoptOptional<string>;
  'msg-id'?: EoptOptional<string>;
  'custom-reward-id'?: EoptOptional<string>;
  'msg-param-custom-reward-title'?: EoptOptional<string>;
  'msg-param-reward-title'?: EoptOptional<string>;

  'reply-parent-msg-id': string;
  'reply-parent-msg-body': string;
  'reply-parent-display-name': string;
  'reply-parent-user-login': string;
}
