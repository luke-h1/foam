export type ChatterRole = 'broadcaster' | 'moderator' | 'vip';

export interface MentionChatter {
  login: string;
  /**
   * The numeric Twitch id. Unset for a chatter known only from a mention.
   */
  userId?: string;
  color: string;
  role?: ChatterRole;
}
