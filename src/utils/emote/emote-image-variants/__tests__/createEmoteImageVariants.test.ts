import type { EmoteImageVariants } from '@app/types/emote';

import { createEmoteImageVariants } from '../createEmoteImageVariants';

describe('createEmoteImageVariants', () => {
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
    ).toEqual<EmoteImageVariants>({
      animated: {
        '4x': 'https://example.com/4x.webp',
        '2x': 'https://example.com/2x.webp',
      },
    });

    expect(createEmoteImageVariants({})).toEqual<EmoteImageVariants>({});
  });
});
