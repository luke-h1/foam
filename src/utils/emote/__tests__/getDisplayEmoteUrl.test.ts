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

  test('returns the static URL when animations are disabled', () => {
    expect(
      getDisplayEmoteUrl({
        url: 'https://example.com/emote.webp',
        static_url: 'https://example.com/emote-static.webp',
        disableAnimations: true,
      }),
    ).toBe('https://example.com/emote-static.webp');
  });

  test('falls back to the animated URL when no static URL is available', () => {
    expect(
      getDisplayEmoteUrl({
        url: 'https://example.com/emote.webp',
        disableAnimations: true,
      }),
    ).toBe('https://example.com/emote.webp');
  });
});
