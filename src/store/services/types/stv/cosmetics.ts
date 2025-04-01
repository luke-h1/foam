import { Badge } from "../util";
import { StvBadge } from "./badge";
import { StvRawBadge } from "./emote";
import { StvPaint } from "./paint";

export interface StvCosmeticsResponse {
  badges: StvRawBadge[];
  paints: StvPaint[];
}

export interface StvCosmetics {
  badges: Badge<StvBadge>;
}
