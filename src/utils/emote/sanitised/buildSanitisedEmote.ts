import type {
  BttvSanitisedEmote,
  EmoteImageVariants,
  EmoteImageVariantSet,
  FfzSanitisedEmote,
  SanitisedEmote,
  TwitchSanitisedEmote,
} from '@app/types/emote';
import { createEmoteImageVariants } from '@app/utils/emote/emote-image-variants/createEmoteImageVariants';
import { pickEmoteVariantUrl } from '@app/utils/emote/emote-image-variants/pickEmoteVariantUrl';
import { SEVEN_TV_ZERO_WIDTH_FLAG } from '@app/utils/seven-tv/constants';

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

type HostedEmoteSource = BttvEmoteSource | FfzEmoteSource | TwitchEmoteSource;

interface HostedEmoteVariants {
  imageVariants: EmoteImageVariants;
  url: string;
  staticUrl: string;
}

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
  source: BttvEmoteSource,
): BttvSanitisedEmote | null;

export function buildSanitisedEmote(
  source: FfzEmoteSource,
): FfzSanitisedEmote | null;

export function buildSanitisedEmote(
  source: TwitchEmoteSource,
): TwitchSanitisedEmote | null;

export function buildSanitisedEmote(
  source: HostedEmoteSource,
): SanitisedEmote | null {
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
      provider: 'bttv' as const,
      flags: source.zeroWidth ? SEVEN_TV_ZERO_WIDTH_FLAG : undefined,
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
      provider: 'ffz' as const,
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
    provider: 'twitch' as const,
    owner_id: source.ownerId,
  };
}
