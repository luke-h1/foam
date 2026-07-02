import type { EmoteSetKind } from '@app/graphql/generated/gql';
import type { StvUser } from '@app/types/seventv/users';

export interface SevenTvEmoteSetMetadata {
  setId: string;
  setName: string;
  capacity: number | null;
  ownerId: string | null;
  kind: EmoteSetKind;
  updatedAt: string;
  totalCount: number;
}

export type EmoteImageScale = '1x' | '2x' | '3x' | '4x';
export type EmoteImageVariantKind = 'animated' | 'static';
export type EmoteImageVariantSet = Partial<Record<EmoteImageScale, string>>;
export type EmoteImageVariants = Partial<
  Record<EmoteImageVariantKind, EmoteImageVariantSet>
>;

interface SanitisedEmoteBase {
  id: string;
  name: string;
  url: string;
  static_url?: string;
  image_variants?: EmoteImageVariants;
  original_name: string;
  creator: string | null;
  emote_link: string;
}

export type SevenTvSite = '7TV Channel' | '7TV Global' | '7TV Personal';

export interface SevenTvSanitisedEmote extends SanitisedEmoteBase {
  site: SevenTvSite;
  frame_count: number;
  format: string;
  flags: number;
  aspect_ratio: number;
  zero_width: boolean;
  width: number;
  height: number;
  set_metadata: SevenTvEmoteSetMetadata;
  actor?: StvUser;
}

export interface BttvSanitisedEmote extends SanitisedEmoteBase {
  site: 'BTTV' | 'Global BTTV';
  flags?: number;
  aspect_ratio?: number;
  zero_width?: boolean;
  width?: number;
  height?: number;
  actor?: StvUser;
}

export interface FfzSanitisedEmote extends SanitisedEmoteBase {
  site: 'FFZ' | 'Global FFZ';
  flags?: number;
  aspect_ratio?: number;
  zero_width?: boolean;
  width?: number;
  height?: number;
  actor?: StvUser;
}

export interface TwitchSanitisedEmote extends SanitisedEmoteBase {
  site: 'Twitch Channel' | 'Twitch Global' | 'Twitch Subscriber';
  flags?: number;
  aspect_ratio?: number;
  zero_width?: boolean;
  width?: number;
  height?: number;
  actor?: StvUser;
}

export interface EmojiSanitisedEmote extends SanitisedEmoteBase {
  site: 'Emoji';
  emoji_hexcode?: string;
  flags?: number;
  aspect_ratio?: number;
  zero_width?: boolean;
  width?: number;
  height?: number;
  actor?: StvUser;
}

export type SanitisedEmote =
  | SevenTvSanitisedEmote
  | BttvSanitisedEmote
  | FfzSanitisedEmote
  | TwitchSanitisedEmote
  | EmojiSanitisedEmote;

export type EmoteSite = SanitisedEmote['site'];
