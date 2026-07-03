export interface TwitchCheermoteImageSet {
  animated: Record<string, string>;
  static: Record<string, string>;
}

export interface TwitchCheermoteTier {
  min_bits: number;
  id: string;
  color: string;
  images: {
    dark: TwitchCheermoteImageSet;
    light: TwitchCheermoteImageSet;
  };
  can_cheer: boolean;
  show_in_bits_card: boolean;
}

export interface TwitchCheermote {
  prefix: string;
  tiers: TwitchCheermoteTier[];
  type: string;
  order: number;
  last_updated: string;
  is_charitable: boolean;
}
