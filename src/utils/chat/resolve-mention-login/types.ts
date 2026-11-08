export type ChatterRole = 'broadcaster' | 'moderator' | 'vip';

export interface MentionChatter {
  login: string;
  userId?: string;
  color: string;
  role?: ChatterRole;
}
