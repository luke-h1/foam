import type {
  EmoteImageScale,
  EmoteImageVariantKind,
  EmoteImageVariants,
  EmoteProvider,
} from '@app/types/emote';

export type EmoteCdnProvider = Exclude<EmoteProvider, 'emoji'>;

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

interface EmoteCdnVariantOptions {
  id: string;
  animated: boolean | null;
  ext?: string;
}

export interface EmoteCdn {
  provider: EmoteCdnProvider;
  parse: (url: string) => EmoteCdnAsset | null;
  build: (options: EmoteCdnUrlOptions) => string;
  pageUrl: (id: string) => string;
  buildVariants: (options: EmoteCdnVariantOptions) => EmoteImageVariants;
}
