import { type Image } from '@app/graphql/generated/gql';
import { pickAnimatedFormat } from '@app/utils/seven-tv/gql/pickAnimatedFormat';
import { pickBestImage } from '@app/utils/seven-tv/gql/pickBestImage';

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
