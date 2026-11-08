import type { Image } from '@app/graphql/generated/gql';

import { pickBestImage } from '../pickBestImage';
import { createGqlImage } from './__fixtures__/gqlImage.fixture';

describe('pickBestImage', () => {
  test('prefers WebP for an animated image so it does not decode through dav1d', () => {
    const images: Image[] = [
      createGqlImage({
        scale: 4,
        frameCount: 24,
        mime: 'image/avif',
        url: 'https://cdn.7tv.app/emote/test/4x.avif',
      }),
      createGqlImage({
        scale: 4,
        frameCount: 24,
        mime: 'image/webp',
        url: 'https://cdn.7tv.app/emote/test/4x.webp',
      }),
    ];

    expect(pickBestImage(images)?.url).toBe(
      'https://cdn.7tv.app/emote/test/4x.webp',
    );
  });

  test('keeps AVIF for a static image, where it is simply the smaller file', () => {
    const images: Image[] = [
      createGqlImage({
        scale: 4,
        mime: 'image/webp',
        url: 'https://cdn.7tv.app/emote/test/4x.webp',
      }),
      createGqlImage({
        scale: 4,
        mime: 'image/avif',
        url: 'https://cdn.7tv.app/emote/test/4x.avif',
      }),
    ];

    expect(pickBestImage(images)?.url).toBe(
      'https://cdn.7tv.app/emote/test/4x.avif',
    );
  });

  test('takes the largest scale that has any image', () => {
    const images: Image[] = [
      createGqlImage({
        scale: 1,
        url: 'https://cdn.7tv.app/emote/test/1x.webp',
      }),
      createGqlImage({
        scale: 3,
        url: 'https://cdn.7tv.app/emote/test/3x.webp',
      }),
    ];

    expect(pickBestImage(images)?.url).toBe(
      'https://cdn.7tv.app/emote/test/3x.webp',
    );
  });

  test('with staticOnly, takes the largest scale that has a still frame', () => {
    const images: Image[] = [
      createGqlImage({
        scale: 4,
        frameCount: 24,
        url: 'https://cdn.7tv.app/emote/test/4x.webp',
      }),
      createGqlImage({
        scale: 2,
        mime: 'image/avif',
        url: 'https://cdn.7tv.app/emote/test/2x_static.avif',
      }),
    ];

    expect(pickBestImage(images, { staticOnly: true })?.url).toBe(
      'https://cdn.7tv.app/emote/test/2x_static.avif',
    );
  });
});
