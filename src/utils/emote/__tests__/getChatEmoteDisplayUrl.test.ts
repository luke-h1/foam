import type { SanitisedEmote } from '@app/types/emote';

import { getChatEmoteDisplayUrl } from '../getChatEmoteDisplayUrl';

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

const tokenOf = ({ url, static_url }: SanitisedEmote) => ({ url, static_url });

describe('getChatEmoteDisplayUrl', () => {
  test.each([false, true])(
    'gives the same url for an emote and its chat token (disableAnimations %s)',
    disableAnimations => {
      const warmUrl = getChatEmoteDisplayUrl(emote, { disableAnimations });

      const renderUrl = getChatEmoteDisplayUrl(tokenOf(emote), {
        disableAnimations,
      });

      expect({ warmUrl, renderUrl }).toEqual({
        warmUrl: disableAnimations
          ? 'https://example.com/static-4x.webp'
          : 'https://example.com/animated-4x.webp',
        renderUrl: warmUrl,
      });
    },
  );

  test('a preferred scale picks that variant', () => {
    expect(
      getChatEmoteDisplayUrl(emote, {
        disableAnimations: false,
        preferredScale: '2x',
      }),
    ).toEqual('https://example.com/animated-2x.webp');
  });
});
