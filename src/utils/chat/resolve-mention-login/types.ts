export type ChatterRole = 'broadcaster' | 'moderator' | 'vip';

export type MentionChatter = {
  login: string;
  userId: string;
  color: string;
  role?: ChatterRole;
};
