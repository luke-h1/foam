import type { EmoteImageVariants } from '@app/types/emote';

import { deriveEmoteImageVariantsFromUrl } from '../deriveEmoteImageVariantsFromUrl';

describe('deriveEmoteImageVariantsFromUrl', () => {
  test('derives both sets from a 7TV _static url', () => {
    expect(
      deriveEmoteImageVariantsFromUrl(
        'https://cdn.7tv.app/emote/abc/2x_static.webp',
      ),
    ).toEqual<EmoteImageVariants>({
      animated: {
        '1x': 'https://cdn.7tv.app/emote/abc/1x.webp',
        '2x': 'https://cdn.7tv.app/emote/abc/2x.webp',
        '3x': 'https://cdn.7tv.app/emote/abc/3x.webp',
        '4x': 'https://cdn.7tv.app/emote/abc/4x.webp',
      },
      static: {
        '1x': 'https://cdn.7tv.app/emote/abc/1x_static.webp',
        '2x': 'https://cdn.7tv.app/emote/abc/2x_static.webp',
        '3x': 'https://cdn.7tv.app/emote/abc/3x_static.webp',
        '4x': 'https://cdn.7tv.app/emote/abc/4x_static.webp',
      },
    });
  });

  test('uses the bare FFZ url for both sets when the url is not animated', () => {
    const bare: EmoteImageVariants['static'] = {
      '1x': 'https://cdn.frankerfacez.com/emote/720507/1',
      '2x': 'https://cdn.frankerfacez.com/emote/720507/2',
      '4x': 'https://cdn.frankerfacez.com/emote/720507/4',
    };

    expect(
      deriveEmoteImageVariantsFromUrl(
        'https://cdn.frankerfacez.com/emote/720507/2',
      ),
    ).toEqual<EmoteImageVariants>({ animated: bare, static: bare });
  });

  test('derives FFZ animated urls only from an animated url', () => {
    expect(
      deriveEmoteImageVariantsFromUrl(
        'https://cdn.frankerfacez.com/emote/720507/animated/2',
      ),
    ).toEqual<EmoteImageVariants>({
      animated: {
        '1x': 'https://cdn.frankerfacez.com/emote/720507/animated/1',
        '2x': 'https://cdn.frankerfacez.com/emote/720507/animated/2',
        '4x': 'https://cdn.frankerfacez.com/emote/720507/animated/4',
      },
      static: {
        '1x': 'https://cdn.frankerfacez.com/emote/720507/1',
        '2x': 'https://cdn.frankerfacez.com/emote/720507/2',
        '4x': 'https://cdn.frankerfacez.com/emote/720507/4',
      },
    });
  });

  test('returns null for an empty or unknown url', () => {
    expect([
      deriveEmoteImageVariantsFromUrl(undefined),
      deriveEmoteImageVariantsFromUrl('https://example.com/a.png'),
    ]).toEqual([null, null]);
  });
});
