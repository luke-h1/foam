import type { Image } from '@app/graphql/generated/gql';

import { pickBestImage } from '../pickBestImage';

const makeImage = (overrides: Partial<Image>): Image => ({
  __typename: 'Image',
  url: 'https://cdn.7tv.app/emote/test/2x.webp',
  mime: 'image/webp',
  scale: 2,
  frameCount: 1,
  size: 0,
  width: 0,
  height: 0,
  ...overrides,
});

describe('pickBestImage', () => {
  test('prefers WebP for an animated image so it does not decode through dav1d', () => {
    const images: Image[] = [
      makeImage({
        scale: 4,
        frameCount: 24,
        mime: 'image/avif',
        url: 'https://cdn.7tv.app/emote/test/4x.avif',
      }),
      makeImage({
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
      makeImage({
        scale: 4,
        mime: 'image/webp',
        url: 'https://cdn.7tv.app/emote/test/4x.webp',
      }),
      makeImage({
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
      makeImage({ scale: 1, url: 'https://cdn.7tv.app/emote/test/1x.webp' }),
      makeImage({ scale: 3, url: 'https://cdn.7tv.app/emote/test/3x.webp' }),
    ];

    expect(pickBestImage(images)?.url).toBe(
      'https://cdn.7tv.app/emote/test/3x.webp',
    );
  });
});
