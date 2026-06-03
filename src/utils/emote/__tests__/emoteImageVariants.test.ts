import { EmoteSetKind } from '@app/graphql/generated/gql';
import type {
  BttvSanitisedEmote,
  FfzSanitisedEmote,
  SevenTvSanitisedEmote,
} from '@app/types/emote';
import {
  createEmoteImageVariants,
  getEmoteImageCacheUrls,
  getEmoteImageVariantUrls,
  pickEmoteVariantUrl,
  withResolvedEmoteImageVariants,
} from '../emoteImageVariants';

function createBaseFields(url: string) {
  return {
    creator: null,
    emote_link: 'https://example.com/emote',
    id: 'emote-id',
    name: 'Dance',
    original_name: 'Dance',
    url,
  };
}

function createBttvEmote(url: string): BttvSanitisedEmote {
  return {
    ...createBaseFields(url),
    site: 'BTTV',
  };
}

function createFfzEmote(url: string): FfzSanitisedEmote {
  return {
    ...createBaseFields(url),
    site: 'FFZ',
  };
}

function createSevenTvEmote(url: string): SevenTvSanitisedEmote {
  return {
    ...createBaseFields(url),
    aspect_ratio: 1,
    flags: 0,
    format: 'WEBP',
    frame_count: 2,
    height: 32,
    set_metadata: {
      capacity: null,
      kind: EmoteSetKind.Normal,
      ownerId: null,
      setId: 'set-id',
      setName: 'global',
      totalCount: 1,
      updatedAt: '2026-05-19T00:00:00Z',
    },
    site: '7TV Global',
    width: 32,
    zero_width: false,
  };
}

describe('emote image variants', () => {
  test('compacts variant sets to populated scale URLs', () => {
    expect(
      createEmoteImageVariants({
        animated: {
          '1x': '',
          '2x': 'https://example.com/2x.webp',
          '4x': 'https://example.com/4x.webp',
        },
        static: {},
      }),
    ).toEqual({
      animated: {
        '4x': 'https://example.com/4x.webp',
        '2x': 'https://example.com/2x.webp',
      },
    });

    expect(createEmoteImageVariants({})).toEqual({});
  });

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

  test('keeps existing variants and ignores unknown CDN URLs', () => {
    const emoteWithVariants = {
      ...createBttvEmote('https://example.com/emote.webp'),
      image_variants: {
        static: {
          '2x': 'https://example.com/static-2x.webp',
        },
      },
    };
    const unknownEmote = createBttvEmote('https://example.com/emote.webp');

    expect(withResolvedEmoteImageVariants(emoteWithVariants)).toBe(
      emoteWithVariants,
    );
    expect(withResolvedEmoteImageVariants(unknownEmote)).toBe(unknownEmote);
  });

  test('derives and caches FFZ image variants', () => {
    const emote = createFfzEmote('https://cdn.frankerfacez.com/emote/1234/4');

    const resolved = withResolvedEmoteImageVariants(emote);

    expect({
      image_variants: resolved.image_variants,
      static_url: resolved.static_url,
    }).toEqual({
      image_variants: {
        animated: {
          '4x': 'https://cdn.frankerfacez.com/emote/1234/animated/4',
          '2x': 'https://cdn.frankerfacez.com/emote/1234/animated/2',
        },
        static: {
          '4x': 'https://cdn.frankerfacez.com/emote/1234/4',
          '2x': 'https://cdn.frankerfacez.com/emote/1234/2',
        },
      },
      static_url: 'https://cdn.frankerfacez.com/emote/1234/4',
    });
    expect(withResolvedEmoteImageVariants(emote)).toBe(resolved);
  });

  test('derives 7TV image variants while preserving the CDN extension', () => {
    const resolved = withResolvedEmoteImageVariants(
      createSevenTvEmote('https://cdn.7tv.app/emote/abc/4x.webp'),
    );

    expect({
      image_variants: resolved.image_variants,
      static_url: resolved.static_url,
    }).toEqual({
      image_variants: {
        animated: {
          '4x': 'https://cdn.7tv.app/emote/abc/4x.webp',
          '2x': 'https://cdn.7tv.app/emote/abc/2x.webp',
        },
        static: {
          '4x': 'https://cdn.7tv.app/emote/abc/4x_static.webp',
          '2x': 'https://cdn.7tv.app/emote/abc/2x_static.webp',
        },
      },
      static_url: 'https://cdn.7tv.app/emote/abc/4x_static.webp',
    });
  });
});
