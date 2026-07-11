import { type Image } from '@app/graphql/generated/gql';
import { pickAnimatedFormat } from '@app/utils/color/sevenTvPaintData/pickAnimatedFormat';
import { pickBestImage } from '@app/utils/color/sevenTvPaintData/pickBestImage';

/**
 * Pick the image URL for a paint's image layer. Animated paints prefer an
 * animated format expo-image can loop; static paints fall back to pickBestImage.
 */
export function pickBestPaintLayerImage(
  images: readonly Image[],
): Image | undefined {
  for (const targetScale of [4, 3, 2, 1]) {
    const animatedAtScale = images.filter(
      img => img.scale === targetScale && img.frameCount > 1,
    );
    if (animatedAtScale.length > 0) {
      return pickAnimatedFormat(animatedAtScale);
    }
  }

  return pickBestImage(images);
}
