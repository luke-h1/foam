export interface BttvBadge {
  id: string;
  name: string;
  displayName: string;
  providerId: string;
  badge?: {
    type: number;
    description: string;
    svg: string;
  };
}
