import type { Image } from '@app/graphql/generated/gql';

import { pickBestPaintLayerImage } from '../sevenTvPaintData';

const makeImage = (overrides: Partial<Image>): Image => ({
  __typename: 'Image',
  url: 'https://cdn.7tv.app/paint/test/2x.webp',
  mime: 'image/webp',
  scale: 2,
  frameCount: 1,
  size: 0,
  width: 0,
  height: 0,
  ...overrides,
});

describe('pickBestPaintLayerImage', () => {
  test('prefers animated WebP over animated AVIF so the texture loops in expo-image', () => {
    const images: Image[] = [
      makeImage({
        scale: 4,
        frameCount: 24,
        mime: 'image/avif',
        url: 'https://cdn.7tv.app/paint/test/4x.avif',
      }),
      makeImage({
        scale: 4,
        frameCount: 24,
        mime: 'image/webp',
        url: 'https://cdn.7tv.app/paint/test/4x.webp',
      }),
      makeImage({
        scale: 4,
        frameCount: 1,
        mime: 'image/avif',
        url: 'https://cdn.7tv.app/paint/test/4x_static.avif',
      }),
    ];

    expect(pickBestPaintLayerImage(images)?.url).toEqual(
      'https://cdn.7tv.app/paint/test/4x.webp',
    );
  });

  test('picks the highest-scale animated frame', () => {
    const images: Image[] = [
      makeImage({
        scale: 2,
        frameCount: 24,
        mime: 'image/webp',
        url: 'https://cdn.7tv.app/paint/test/2x.webp',
      }),
      makeImage({
        scale: 4,
        frameCount: 24,
        mime: 'image/webp',
        url: 'https://cdn.7tv.app/paint/test/4x.webp',
      }),
    ];

    expect(pickBestPaintLayerImage(images)?.url).toEqual(
      'https://cdn.7tv.app/paint/test/4x.webp',
    );
  });

  test('falls back to AVIF for static-only paints', () => {
    const images: Image[] = [
      makeImage({
        scale: 4,
        frameCount: 1,
        mime: 'image/webp',
        url: 'https://cdn.7tv.app/paint/test/4x_static.webp',
      }),
      makeImage({
        scale: 4,
        frameCount: 1,
        mime: 'image/avif',
        url: 'https://cdn.7tv.app/paint/test/4x_static.avif',
      }),
    ];

    expect(pickBestPaintLayerImage(images)?.url).toEqual(
      'https://cdn.7tv.app/paint/test/4x_static.avif',
    );
  });
});
