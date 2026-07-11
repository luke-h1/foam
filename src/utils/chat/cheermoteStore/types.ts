export interface CheermoteTier {
  color: string;
  minBits: number;
  staticUrl: string;
  url: string;
}

/**
 * Lowercased cheer prefix -> tiers sorted by ascending min_bits.
 */
export type ChannelCheermotes = Map<string, CheermoteTier[]>;
