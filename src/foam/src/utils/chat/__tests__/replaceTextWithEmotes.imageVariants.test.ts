import type { SanitisedEmote } from '@app/types/emote';

import { replaceTextWithEmotes } from '../replaceTextWithEmotes';

const emptyParams = {
  userstate: null,
  emojiEmotes: [],
  sevenTvGlobalEmotes: [],
  sevenTvChannelEmotes: [],
  sevenTvPersonalEmotes: [],
  twitchGlobalEmotes: [],
  twitchChannelEmotes: [],
  twitchSubscriberEmotes: [],
  ffzChannelEmotes: [],
  ffzGlobalEmotes: [],
  bttvChannelEmotes: [],
  bttvGlobalEmotes: [],
};

describe('replaceTextWithEmotes image variants', () => {
  test('preserves static and animated image variants on mapped emote parts', () => {
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
    };

    const result = replaceTextWithEmotes({
      ...emptyParams,
      inputString: 'VariantDance',
      bttvChannelEmotes: [emote],
    });

    expect(
      result.map(part => ({
        content: 'content' in part ? part.content : undefined,
        image_variants: part.type === 'emote' ? part.image_variants : undefined,
        type: part.type,
      })),
    ).toEqual([
      {
        content: 'VariantDance',
        image_variants: emote.image_variants,
        type: 'emote',
      },
    ]);
  });

  test('backfills static image variants for old cached BTTV emotes', () => {
    const result = replaceTextWithEmotes({
      ...emptyParams,
      inputString: 'catJAM',
      bttvChannelEmotes: [
        {
          id: '5f1b0186cf6d2144653d2970',
          name: 'catJAM',
          original_name: 'catJAM',
          creator: null,
          emote_link: 'https://betterttv.com/emotes/5f1b0186cf6d2144653d2970',
          url: 'https://cdn.betterttv.net/emote/5f1b0186cf6d2144653d2970/3x',
          site: 'BTTV',
        },
      ],
    });

    const [emotePart] = result;
    expect({
      content:
        emotePart && 'content' in emotePart ? emotePart.content : undefined,
      static3x:
        emotePart?.type === 'emote'
          ? emotePart.image_variants?.static?.['3x']
          : undefined,
      static_url:
        emotePart?.type === 'emote' ? emotePart.static_url : undefined,
      type: emotePart?.type,
    }).toEqual({
      content: 'catJAM',
      static3x:
        'https://cdn.betterttv.net/emote/5f1b0186cf6d2144653d2970/3x.png',
      static_url:
        'https://cdn.betterttv.net/emote/5f1b0186cf6d2144653d2970/3x.png',
      type: 'emote',
    });
  });
});
