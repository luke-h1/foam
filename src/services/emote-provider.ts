import type {
  BttvSanitisedEmote,
  EmoteImageVariants,
  EmoteImageVariantSet,
  FfzSanitisedEmote,
  SanitisedEmote,
  SevenTvEmoteSetMetadata,
  SevenTvSanitisedEmote,
  TwitchSanitisedEmote,
} from '@app/types/emote';
import type { StvUser } from '@app/types/seventv/users';
import { createEmoteImageVariants } from '@app/utils/emote/emoteImageVariants/createEmoteImageVariants';
import { pickEmoteVariantUrl } from '@app/utils/emote/emoteImageVariants/pickEmoteVariantUrl';

interface HostedEmoteSourceBase {
  id: string;
  name: string;
  creator: string | null;
  emoteLink: string;
  originalName?: string;
  animated: EmoteImageVariantSet;
  static: EmoteImageVariantSet;
}

export interface BttvEmoteSource extends HostedEmoteSourceBase {
  site: BttvSanitisedEmote['site'];
  zeroWidth: boolean;
}

export interface FfzEmoteSource extends HostedEmoteSourceBase {
  site: FfzSanitisedEmote['site'];
  width: number;
  height: number;
}

export interface TwitchEmoteSource extends HostedEmoteSourceBase {
  site: TwitchSanitisedEmote['site'];
  ownerId?: string;
}

/**
 * 7TV urls and variants arrive resolved (best file per kind already picked)
 * instead of as raw variant sets like the hosted providers.
 */
export interface SevenTvEmoteSource {
  site: SevenTvSanitisedEmote['site'];
  id: string;
  name: string;
  originalName: string;
  creator: string | null;
  url: string;
  staticUrl: string | undefined;
  imageVariants: EmoteImageVariants | undefined;
  flags: number;
  frameCount: number;
  format: string;
  aspectRatio: number;
  zeroWidth: boolean;
  width: number;
  height: number;
  setMetadata: SevenTvEmoteSetMetadata;
  actor?: StvUser;
}

export type EmoteProviderSource =
  BttvEmoteSource | FfzEmoteSource | TwitchEmoteSource | SevenTvEmoteSource;

type HostedEmoteVariants = {
  imageVariants: EmoteImageVariants;
  url: string;
  staticUrl: string;
};

function buildHostedVariants(
  source: HostedEmoteSourceBase,
): HostedEmoteVariants {
  const imageVariants = createEmoteImageVariants({
    animated: source.animated,
    static: source.static,
  });
  return {
    imageVariants,
    url: pickEmoteVariantUrl({ imageVariants, preferredKind: 'animated' }),
    staticUrl: pickEmoteVariantUrl({ imageVariants, preferredKind: 'static' }),
  };
}

export function buildSanitisedEmote(
  source: SevenTvEmoteSource,
): SevenTvSanitisedEmote | null;
export function buildSanitisedEmote(
  source: BttvEmoteSource,
): BttvSanitisedEmote | null;
export function buildSanitisedEmote(
  source: FfzEmoteSource,
): FfzSanitisedEmote | null;
export function buildSanitisedEmote(
  source: TwitchEmoteSource,
): TwitchSanitisedEmote | null;
export function buildSanitisedEmote(
  source: EmoteProviderSource,
): SanitisedEmote | null {
  if ('setMetadata' in source) {
    if (!source.url) {
      return null;
    }
    return {
      name: source.name,
      id: source.id,
      url: source.url,
      static_url: source.staticUrl,
      image_variants: source.imageVariants,
      flags: source.flags,
      original_name: source.originalName,
      creator: source.creator,
      emote_link: `https://7tv.app/emotes/${source.id}`,
      site: source.site,
      provider: '7tv',
      frame_count: source.frameCount,
      format: source.format,
      aspect_ratio: source.aspectRatio,
      zero_width: source.zeroWidth,
      width: source.width,
      height: source.height,
      set_metadata: source.setMetadata,
      actor: source.actor,
    };
  }

  const { imageVariants, url, staticUrl } = buildHostedVariants(source);
  if (!url) {
    return null;
  }

  if ('zeroWidth' in source) {
    return {
      name: source.name,
      id: source.id,
      url,
      static_url: staticUrl,
      image_variants: imageVariants,
      emote_link: source.emoteLink,
      original_name: source.originalName ?? 'UNKNOWN',
      creator: source.creator,
      site: source.site,
      provider: 'bttv',
      flags: source.zeroWidth ? 256 : undefined,
      zero_width: source.zeroWidth || undefined,
    };
  }

  if ('width' in source) {
    return {
      name: source.name,
      id: source.id,
      url,
      static_url: staticUrl,
      image_variants: imageVariants,
      emote_link: source.emoteLink,
      original_name: source.originalName ?? 'UNKNOWN',
      creator: source.creator,
      site: source.site,
      provider: 'ffz',
      width: source.width,
      height: source.height,
      aspect_ratio: source.height > 0 ? source.width / source.height : 1,
    };
  }

  return {
    name: source.name,
    id: source.id,
    url,
    static_url: staticUrl,
    image_variants: imageVariants,
    emote_link: source.emoteLink,
    original_name: source.originalName ?? 'UNKNOWN',
    creator: source.creator,
    site: source.site,
    provider: 'twitch',
    owner_id: source.ownerId,
  };
}
