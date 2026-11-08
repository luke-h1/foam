import { type Image } from '@app/graphql/generated/gql';

/**
 * Returns the image in the first format of `formats` that `imgs` holds, or
 * the first image when none match.
 */
export function pickFirstFormat(
  imgs: Image[],
  formats: readonly string[],
): Image | undefined {
  'worklet';

  const byMime = new Map<string, Image>();

  for (const img of imgs) {
    if (!byMime.has(img.mime)) {
      byMime.set(img.mime, img);
    }
  }

  for (const format of formats) {
    const match = byMime.get(`image/${format}`);

    if (match) {
      return match;
    }
  }

  return imgs[0];
}
