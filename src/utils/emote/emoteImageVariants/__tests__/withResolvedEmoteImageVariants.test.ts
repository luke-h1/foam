import { withResolvedEmoteImageVariants } from '../withResolvedEmoteImageVariants';
import {
  createBttvEmote,
  createFfzEmote,
  createSevenTvEmote,
} from './__fixtures__/emoteImageVariants.fixture';

describe('withResolvedEmoteImageVariants', () => {
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
          '1x': 'https://cdn.frankerfacez.com/emote/1234/animated/1',
        },
        static: {
          '4x': 'https://cdn.frankerfacez.com/emote/1234/4',
          '2x': 'https://cdn.frankerfacez.com/emote/1234/2',
          '1x': 'https://cdn.frankerfacez.com/emote/1234/1',
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
          '1x': 'https://cdn.7tv.app/emote/abc/1x.webp',
        },
        static: {
          '4x': 'https://cdn.7tv.app/emote/abc/4x_static.webp',
          '2x': 'https://cdn.7tv.app/emote/abc/2x_static.webp',
          '1x': 'https://cdn.7tv.app/emote/abc/1x_static.webp',
        },
      },
      static_url: 'https://cdn.7tv.app/emote/abc/4x_static.webp',
    });
  });
});
