export interface FfzBadge {
  id: number;
  name: string;
  title: string;
  slot: number;
  replaces: string;
  color: string;
  image: string;
  urls: {
    '1': string;
    '2': string;
    '4': string;
  };
}

export interface FfzBadgeUsers {
  [badgeId: string]: string[];
}

export interface FfzBadgesResponse {
  badges: FfzBadge[];
  users: FfzBadgeUsers;
}
