import type { Image } from '@app/graphql/generated/gql';

import { pickBestPaintLayerImage } from '../pickBestPaintLayerImage';
import { createGqlImage } from './__fixtures__/gqlImage.fixture';

describe('pickBestPaintLayerImage', () => {
  test('prefers an animated frame at a lower scale over a static one at a higher scale', () => {
    const images: Image[] = [
      createGqlImage({
        scale: 4,
        frameCount: 1,
        url: 'https://cdn.7tv.app/paint/test/4x_static.webp',
      }),
      createGqlImage({
        scale: 2,
        frameCount: 24,
        url: 'https://cdn.7tv.app/paint/test/2x.webp',
      }),
    ];

    expect(pickBestPaintLayerImage(images)?.url).toBe(
      'https://cdn.7tv.app/paint/test/2x.webp',
    );
  });

  test('falls back to the best static image when no frame is animated', () => {
    const images: Image[] = [
      createGqlImage({
        scale: 2,
        url: 'https://cdn.7tv.app/paint/test/2x_static.webp',
      }),
      createGqlImage({
        scale: 4,
        url: 'https://cdn.7tv.app/paint/test/4x_static.webp',
      }),
    ];

    expect(pickBestPaintLayerImage(images)?.url).toBe(
      'https://cdn.7tv.app/paint/test/4x_static.webp',
    );
  });
});
