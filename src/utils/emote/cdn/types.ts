import type {
  EmoteImageScale,
  EmoteImageVariantKind,
  EmoteImageVariants,
  EmoteProvider,
} from '@app/types/emote';

export type EmoteCdnProvider = Exclude<EmoteProvider, 'emoji'>;

/**
 * What one CDN url says about the image it serves. `kind` is null when the
 * url form does not tell animated and static apart.
 */
export interface EmoteCdnAsset {
  id: string;
  scale: EmoteImageScale;
  kind: EmoteImageVariantKind | null;
  ext: string | null;
}

export interface EmoteCdnUrlOptions {
  id: string;
  scale: EmoteImageScale;
  kind: EmoteImageVariantKind;
  ext?: string;
}

/**
 * `animated` is null when the caller does not know. Each provider then picks
 * the variant set that is safe for its CDN.
 */
interface EmoteCdnVariantOptions {
  id: string;
  animated: boolean | null;
  ext?: string;
}

export interface EmoteCdn {
  provider: EmoteCdnProvider;
  parse: (url: string) => EmoteCdnAsset | null;
  build: (options: EmoteCdnUrlOptions) => string;
  /**
   * The provider's web page for the emote.
   */
  pageUrl: (id: string) => string;
  buildVariants: (options: EmoteCdnVariantOptions) => EmoteImageVariants;
}
