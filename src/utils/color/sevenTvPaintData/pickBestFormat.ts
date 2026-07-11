import { type Image } from '@app/graphql/generated/gql';

/**
 * Pick the best format from a set of images at the same scale.
 * Prefers AVIF > WebP > first available.
 */
export function pickBestFormat(imgs: Image[]): Image | undefined {
  return (
    imgs.find(img => img.mime === 'image/avif') ??
    imgs.find(img => img.mime === 'image/webp') ??
    imgs[0]
  );
}
