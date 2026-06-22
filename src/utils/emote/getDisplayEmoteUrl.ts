/* eslint-disable camelcase */
import type { EmoteImageScale, EmoteImageVariants } from '@app/types/emote';

import { pickEmoteVariantUrl } from './emoteImageVariants';

export function getDisplayEmoteUrl({
  image_variants,
  url,
  static_url,
  disableAnimations = false,
  preferredScale,
}: {
  image_variants?: EmoteImageVariants | null;
  url?: string | null;
  static_url?: string | null;
  disableAnimations?: boolean;
  preferredScale?: EmoteImageScale;
}) {
  if (disableAnimations) {
    return pickEmoteVariantUrl({
      fallbackUrl: static_url ?? url,
      imageVariants: image_variants,
      preferredKind: 'static',
      preferredScale,
    });
  }

  return pickEmoteVariantUrl({
    fallbackUrl: url,
    imageVariants: image_variants,
    preferredKind: 'animated',
    preferredScale,
  });
}
