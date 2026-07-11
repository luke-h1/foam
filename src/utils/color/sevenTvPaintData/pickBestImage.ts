import { type Image } from '@app/graphql/generated/gql';
import { pickBestFormat } from '@app/utils/color/sevenTvPaintData/pickBestFormat';

export function pickBestImage(images: readonly Image[]): Image | undefined {
  const scales = [4, 3, 2, 1];

  return scales.reduce<Image | undefined>((found, targetScale) => {
    if (found) {
      return found;
    }

    const atScale = images.filter(img => img.scale === targetScale);
    if (atScale.length === 0) {
      return undefined;
    }

    const animated = atScale.filter(img => img.frameCount > 1);
    return animated.length > 0
      ? pickBestFormat(animated)
      : pickBestFormat(atScale);
  }, undefined);
}
