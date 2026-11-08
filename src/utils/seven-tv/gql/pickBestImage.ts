import { type Image } from '@app/graphql/generated/gql';
import { pickAnimatedFormat } from '@app/utils/seven-tv/gql/pickAnimatedFormat';
import { pickBestFormat } from '@app/utils/seven-tv/gql/pickBestFormat';

interface PickBestImageOptions {
  /**
   * Skip animated images. Use this for the still frame of an animated emote.
   */
  staticOnly?: boolean;
}

/**
 * Picks the largest image, and the best format at that scale. Without
 * `staticOnly` an animated image wins over a static one at the same scale.
 */
export function pickBestImage(
  images: readonly Image[],
  { staticOnly = false }: PickBestImageOptions = {},
): Image | undefined {
  'worklet';

  for (const targetScale of [4, 3, 2, 1]) {
    const atScale = images.filter(img => img.scale === targetScale);
    const statics = atScale.filter(img => img.frameCount <= 1);
    const animated = atScale.filter(img => img.frameCount > 1);

    if (staticOnly && statics.length > 0) {
      return pickBestFormat(statics);
    }

    if (!staticOnly && animated.length > 0) {
      return pickAnimatedFormat(animated);
    }

    if (!staticOnly && atScale.length > 0) {
      return pickBestFormat(atScale);
    }
  }

  return undefined;
}
