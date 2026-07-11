import { pickEmoteVariantUrl } from '../pickEmoteVariantUrl';

describe('pickEmoteVariantUrl', () => {
  test('picks preferred, alternate, and fallback URLs', () => {
    expect(
      pickEmoteVariantUrl({
        fallbackUrl: 'https://example.com/fallback.webp',
        imageVariants: {
          animated: {
            '3x': 'https://example.com/animated-3x.webp',
          },
          static: {
            '4x': 'https://example.com/static-4x.webp',
          },
        },
        preferredKind: 'static',
        preferredScale: '2x',
      }),
    ).toBe('https://example.com/static-4x.webp');

    expect(
      pickEmoteVariantUrl({
        fallbackUrl: 'https://example.com/fallback.webp',
        imageVariants: {
          animated: {
            '3x': 'https://example.com/animated-3x.webp',
          },
        },
        preferredKind: 'static',
      }),
    ).toBe('https://example.com/animated-3x.webp');

    expect(
      pickEmoteVariantUrl({
        fallbackUrl: null,
        imageVariants: {},
        preferredKind: 'animated',
      }),
    ).toBe('');
  });
});
