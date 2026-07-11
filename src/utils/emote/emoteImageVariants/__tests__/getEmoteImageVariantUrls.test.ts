import { getEmoteImageCacheUrls } from '../getEmoteImageCacheUrls';
import { getEmoteImageVariantUrls } from '../getEmoteImageVariantUrls';
import { createBttvEmote } from './__fixtures__/emoteImageVariants.fixture';

describe('getEmoteImageVariantUrls', () => {
  test('collects cache URLs and derived variant URLs without duplicates', () => {
    const emote = {
      ...createBttvEmote('https://example.com/animated-4x.webp'),
      image_variants: {
        animated: {
          '2x': 'https://example.com/animated-2x.webp',
          '4x': 'https://example.com/animated-4x.webp',
        },
        static: {
          '2x': 'https://example.com/static-2x.webp',
          '4x': 'https://example.com/static-4x.webp',
        },
      },
      static_url: 'https://example.com/static-4x.webp',
    };

    expect(getEmoteImageCacheUrls(emote)).toEqual([
      'https://example.com/animated-4x.webp',
      'https://example.com/static-4x.webp',
    ]);
    expect(getEmoteImageVariantUrls(emote)).toEqual([
      'https://example.com/animated-4x.webp',
      'https://example.com/static-4x.webp',
      'https://example.com/animated-2x.webp',
      'https://example.com/static-2x.webp',
    ]);
  });
});
