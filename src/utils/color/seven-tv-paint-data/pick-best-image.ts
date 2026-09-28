import { type Image } from '@app/graphql/generated/gql';
import { pickAnimatedFormat } from '@app/utils/color/seven-tv-paint-data/pick-animated-format';
import { pickBestFormat } from '@app/utils/color/seven-tv-paint-data/pick-best-format';

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
      ? pickAnimatedFormat(animated)
      : pickBestFormat(atScale);
  }, undefined);
}
