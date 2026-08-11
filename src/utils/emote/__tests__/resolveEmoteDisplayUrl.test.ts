import { preferences$ } from '@app/store/preferences/state';
import type { SanitisedEmote } from '@app/types/emote';

import { resolveEmoteDisplayUrl } from '../resolveEmoteDisplayUrl';

const emote: SanitisedEmote = {
  id: 'variant-emote',
  name: 'VariantDance',
  original_name: 'VariantDance',
  creator: null,
  emote_link: 'https://example.com/emote',
  url: 'https://example.com/animated-4x.webp',
  static_url: 'https://example.com/static-4x.webp',
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
  site: 'BTTV',
  provider: 'bttv',
};

describe('resolveEmoteDisplayUrl', () => {
  afterEach(() => {
    preferences$.disableEmoteAnimations.set(false);
  });

  test('warm url equals render url when animations are enabled', () => {
    preferences$.disableEmoteAnimations.set(false);

    const warmUrl = resolveEmoteDisplayUrl(emote);
    const renderUrl = resolveEmoteDisplayUrl(emote, {
      disableAnimations: false,
    });

    expect(warmUrl).toBe('https://example.com/animated-2x.webp');
    expect(renderUrl).toBe(warmUrl);
  });

  test('warm url equals render url when animations are disabled', () => {
    preferences$.disableEmoteAnimations.set(true);

    const warmUrl = resolveEmoteDisplayUrl(emote);
    const renderUrl = resolveEmoteDisplayUrl(emote, {
      disableAnimations: true,
    });

    expect(warmUrl).toBe('https://example.com/static-2x.webp');
    expect(renderUrl).toBe(warmUrl);
  });

  test('an explicit preview value overrides the persisted preference', () => {
    preferences$.disableEmoteAnimations.set(false);

    expect(resolveEmoteDisplayUrl(emote, { disableAnimations: true })).toBe(
      'https://example.com/static-2x.webp',
    );
  });

  test('a preferred scale overrides the chat inline default', () => {
    expect(resolveEmoteDisplayUrl(emote, { preferredScale: '4x' })).toBe(
      'https://example.com/animated-4x.webp',
    );
  });
});
