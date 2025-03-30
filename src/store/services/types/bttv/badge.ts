export interface BttvBadge {
  id: string;
  name: string;
  displayName: string;
  providerId: string;
  badge: {
    description: string;
    svg: string;
  };
}

export type BttvGlobalBadgesResponse = BttvBadge[];
