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

  test('never resolves a render scale down to a 1x variant', () => {
    expect(
      pickEmoteVariantUrl({
        fallbackUrl: 'https://example.com/fallback.webp',
        imageVariants: {
          static: {
            '1x': 'https://example.com/static-1x.webp',
          },
        },
        preferredKind: 'static',
        preferredScale: '2x',
      }),
    ).toBe('https://example.com/fallback.webp');
  });

  test('resolves a 1x variant only when 1x is asked for explicitly', () => {
    expect(
      pickEmoteVariantUrl({
        fallbackUrl: 'https://example.com/fallback.webp',
        imageVariants: {
          static: {
            '1x': 'https://example.com/static-1x.webp',
          },
        },
        preferredKind: 'static',
        preferredScale: '1x',
      }),
    ).toBe('https://example.com/static-1x.webp');
  });
});
