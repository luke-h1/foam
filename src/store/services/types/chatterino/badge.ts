import { OmitStrict } from "../util";

export interface ChatterinoRawBadge {
  tooltip: string;
  image1: string;
  image2: string;
  image3: string;
  users: string[];
}

export type ChatterinoBadge = OmitStrict<ChatterinoRawBadge, "users">;

export interface ChatterinoBadgesResponse {
  badges: ChatterinoRawBadge[];
}
