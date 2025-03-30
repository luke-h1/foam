import { components } from "../generated/ffz.generated";

export type FfzBadge = components["schemas"]["Badge"];

export interface FfzGlobalBadgesResponse {
  badges: FfzBadge[];
  users: Record<string, number[]>;
}

export interface FfzApBadge {
  id: string | number;
  tier: 1 | 2 | 3;
  badge_color?: string;
  badge_is_colored?: 0 | 1;
  admin?: 1;
}

export type FfzApGlobalBadgesResponse = FfzApBadge[];
