import type {
  EmoteImageVariants,
  EmoteImageVariantSet,
  EmoteSite,
} from '@app/types/emote';
import {
  createEmoteImageVariants,
  pickEmoteVariantUrl,
} from '@app/utils/emote/emoteImageVariants';

export interface EmoteProviderSource<Site extends EmoteSite> {
  id: string;
  name: string;
  site: Site;
  creator: string | null;
  emoteLink: string;
  originalName?: string;
  animated: EmoteImageVariantSet;
  static: EmoteImageVariantSet;
}

export interface ProviderSanitisedEmote<Site extends EmoteSite> {
  id: string;
  name: string;
  url: string;
  static_url: string;
  image_variants: EmoteImageVariants;
  original_name: string;
  creator: string | null;
  emote_link: string;
  site: Site;
}

/**
 * Assembles the sanitised emote contract shared by the BTTV, FFZ and Twitch
 * providers: compacts the animated/static variant sets into `image_variants`,
 * picks the highest available scale for `url` and `static_url`, and defaults
 * `original_name` to 'UNKNOWN' when the provider does not supply one.
 */
export function buildSanitisedEmote<Site extends EmoteSite>(
  source: EmoteProviderSource<Site>,
): ProviderSanitisedEmote<Site> {
  const imageVariants = createEmoteImageVariants({
    animated: source.animated,
    static: source.static,
  });

  return {
    name: source.name,
    id: source.id,
    url: pickEmoteVariantUrl({
      imageVariants,
      preferredKind: 'animated',
    }),
    static_url: pickEmoteVariantUrl({
      imageVariants,
      preferredKind: 'static',
    }),
    image_variants: imageVariants,
    emote_link: source.emoteLink,
    original_name: source.originalName ?? 'UNKNOWN',
    creator: source.creator,
    site: source.site,
  };
}
