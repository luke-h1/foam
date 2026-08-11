import type { SanitisedEmote } from '@app/types/emote';

import { withResolvedEmoteImageVariants } from '../emoteImageVariants/withResolvedEmoteImageVariants';
import { getDisplayEmoteUrl } from '../getDisplayEmoteUrl';

describe('getDisplayEmoteUrl', () => {
  test('returns the animated URL when animations are enabled', () => {
    expect(
      getDisplayEmoteUrl({
        url: 'https://example.com/emote.webp',
        static_url: 'https://example.com/emote-static.webp',
        disableAnimations: false,
      }),
    ).toBe('https://example.com/emote.webp');
  });

  test('prefers the stored 4x animated variant when animations are enabled', () => {
    expect(
      getDisplayEmoteUrl({
        url: 'https://example.com/emote-legacy.webp',
        static_url: 'https://example.com/emote-static-legacy.webp',
        image_variants: {
          animated: {
            '2x': 'https://example.com/emote-2x.webp',
            '4x': 'https://example.com/emote-4x.webp',
          },
          static: {
            '2x': 'https://example.com/emote-static-2x.webp',
            '4x': 'https://example.com/emote-static-4x.webp',
          },
        },
      }),
    ).toBe('https://example.com/emote-4x.webp');
  });

  test('returns the static URL when animations are disabled', () => {
    expect(
      getDisplayEmoteUrl({
        url: 'https://example.com/emote.webp',
        static_url: 'https://example.com/emote-static.webp',
        disableAnimations: true,
      }),
    ).toBe('https://example.com/emote-static.webp');
  });

  test('prefers the stored 4x static variant when animations are disabled', () => {
    expect(
      getDisplayEmoteUrl({
        url: 'https://example.com/emote-legacy.webp',
        static_url: 'https://example.com/emote-static-legacy.webp',
        image_variants: {
          animated: {
            '4x': 'https://example.com/emote-4x.webp',
          },
          static: {
            '2x': 'https://example.com/emote-static-2x.webp',
            '4x': 'https://example.com/emote-static-4x.webp',
          },
        },
        disableAnimations: true,
      }),
    ).toBe('https://example.com/emote-static-4x.webp');
  });

  test('falls back to the animated URL when no static URL is available', () => {
    expect(
      getDisplayEmoteUrl({
        url: 'https://example.com/emote.webp',
        disableAnimations: true,
      }),
    ).toBe('https://example.com/emote.webp');
  });

  test('derives a BTTV static URL for old cached emotes without variants', () => {
    const cachedEmote: SanitisedEmote = {
      id: '5eJAM',
      name: 'catJAM',
      original_name: 'catJAM',
      creator: null,
      emote_link: 'https://betterttv.com/emotes/5eJAM',
      url: 'https://cdn.betterttv.net/emote/5eJAM/3x',
      site: 'BTTV',
      provider: 'bttv',
    };
    const emote = withResolvedEmoteImageVariants(cachedEmote);

    expect(
      getDisplayEmoteUrl({
        url: emote.url,
        static_url: emote.static_url,
        image_variants: emote.image_variants,
        disableAnimations: true,
      }),
    ).toBe('https://cdn.betterttv.net/emote/5eJAM/3x.png');
  });
});
