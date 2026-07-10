export interface BttvBadge {
  id: string;
  name: string;
  displayName: string;
  /**
   * The badge owner's Twitch user id; BTTV badges are matched to chatters by
   * this id.
   */
  providerId: string;
  badge: {
    type: number;
    description: string;
    svg: string;
  };
}
