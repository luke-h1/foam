import { buildImageFallbackChain } from '../imageFallbackChain';

describe('buildImageFallbackChain', () => {
  test('walks format then size for a 7TV badge that 404s at 4x.webp', () => {
    expect(
      buildImageFallbackChain('https://cdn.7tv.app/badge/01H85/4x.webp'),
    ).toEqual([
      'https://cdn.7tv.app/badge/01H85/4x.webp',
      'https://cdn.7tv.app/badge/01H85/4x.avif',
      'https://cdn.7tv.app/badge/01H85/3x.webp',
      'https://cdn.7tv.app/badge/01H85/3x.avif',
      'https://cdn.7tv.app/badge/01H85/2x.webp',
      'https://cdn.7tv.app/badge/01H85/2x.avif',
      'https://cdn.7tv.app/badge/01H85/1x.webp',
      'https://cdn.7tv.app/badge/01H85/1x.avif',
    ]);
  });

  test('keeps the original format first and adds the alternate for an avif emote', () => {
    expect(
      buildImageFallbackChain('https://cdn.7tv.app/emote/abc/2x.avif'),
    ).toEqual([
      'https://cdn.7tv.app/emote/abc/2x.avif',
      'https://cdn.7tv.app/emote/abc/2x.webp',
      'https://cdn.7tv.app/emote/abc/1x.avif',
      'https://cdn.7tv.app/emote/abc/1x.webp',
    ]);
  });

  test('preserves a protocol-relative host and a _static suffix', () => {
    expect(
      buildImageFallbackChain('//cdn.7tv.app/emote/abc/4x_static.webp'),
    ).toEqual([
      '//cdn.7tv.app/emote/abc/4x_static.webp',
      '//cdn.7tv.app/emote/abc/4x_static.avif',
      '//cdn.7tv.app/emote/abc/3x_static.webp',
      '//cdn.7tv.app/emote/abc/3x_static.avif',
      '//cdn.7tv.app/emote/abc/2x_static.webp',
      '//cdn.7tv.app/emote/abc/2x_static.avif',
      '//cdn.7tv.app/emote/abc/1x_static.webp',
      '//cdn.7tv.app/emote/abc/1x_static.avif',
    ]);
  });

  test('includes a png variant as both source and fallback when present', () => {
    expect(
      buildImageFallbackChain('https://cdn.7tv.app/badge/abc/1x.png'),
    ).toEqual([
      'https://cdn.7tv.app/badge/abc/1x.png',
      'https://cdn.7tv.app/badge/abc/1x.webp',
      'https://cdn.7tv.app/badge/abc/1x.avif',
    ]);
  });

  test('returns the URL untouched when it has no derivable size/format variants', () => {
    expect(
      buildImageFallbackChain(
        'https://static-cdn.jtvnw.net/emoticons/v2/x/default/dark/3.0',
      ),
    ).toEqual(['https://static-cdn.jtvnw.net/emoticons/v2/x/default/dark/3.0']);

    expect(
      buildImageFallbackChain('https://cdn.betterttv.net/emote/abc/3x'),
    ).toEqual(['https://cdn.betterttv.net/emote/abc/3x']);
  });
});
