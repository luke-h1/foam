import { replaceTextWithEmotes } from '@app/utils/chat/replaceTextWithEmotes/replaceTextWithEmotes';

import type { ParsedPart } from '../parsedPart';
import { createEmojiEmote } from './__fixtures__/emojiEmote.fixture';

describe('emoji shortcode parsing', () => {
  const emojiEmotes = [
    createEmojiEmote({
      id: '1F602',
      name: ':joy:',
      url: 'https://example.com/joy.png',
    }),
    createEmojiEmote({
      id: '1F602',
      name: ':haha:',
      url: 'https://example.com/joy.png',
    }),
  ];

  const emptyParams = {
    userstate: null,
    emojiEmotes,
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

  test('matches :emoji: aliases as emotes', () => {
    const result = replaceTextWithEmotes({
      ...emptyParams,
      inputString: 'hello :joy: :haha:',
    });

    expect(result).toEqual<ParsedPart[]>([
      { type: 'text', content: 'hello' },
      { type: 'text', content: ' ' },
      {
        id: '1F602',
        name: ':joy:',
        type: 'emote',
        content: ':joy:',
        creator: null,
        emote_link: '',
        original_name: ':joy:',
        site: 'Emoji',
        static_url: 'https://example.com/joy.png',
        url: 'https://example.com/joy.png',
        aspect_ratio: 1,
        zero_width: false,
        width: 72,
        height: 72,
      },
      { type: 'text', content: ' ' },
      {
        id: '1F602',
        name: ':haha:',
        type: 'emote',
        content: ':haha:',
        creator: null,
        emote_link: '',
        original_name: ':haha:',
        site: 'Emoji',
        static_url: 'https://example.com/joy.png',
        url: 'https://example.com/joy.png',
        aspect_ratio: 1,
        zero_width: false,
        width: 72,
        height: 72,
      },
    ]);
  });

  test('matches direct unicode emoji and preserves the original character', () => {
    const result = replaceTextWithEmotes({
      ...emptyParams,
      inputString: '😂',
    });

    expect(result).toEqual<ParsedPart[]>([
      {
        id: '1F602',
        name: ':joy:',
        type: 'emote',
        content: '😂',
        creator: null,
        emote_link: '',
        image_variants: undefined,
        original_name: '😂',
        site: 'Emoji',
        static_url: 'https://example.com/joy.png',
        thumbnail: 'https://example.com/joy.png',
        url: 'https://example.com/joy.png',
        aspect_ratio: 1,
        zero_width: false,
        width: 72,
        height: 72,
      },
    ]);
  });

  test('matches Twitch subscriber emotes separately from 7TV personal emotes', () => {
    const result = replaceTextWithEmotes({
      ...emptyParams,
      inputString: 'SubHype',
      twitchSubscriberEmotes: [
        {
          id: 'emotesv2_sub',
          name: 'SubHype',
          original_name: 'SubHype',
          creator: null,
          emote_link:
            'https://static-cdn.jtvnw.net/emoticons/v2/emotesv2_sub/default/dark/3.0',
          url: 'https://static-cdn.jtvnw.net/emoticons/v2/emotesv2_sub/default/dark/3.0',
          static_url:
            'https://static-cdn.jtvnw.net/emoticons/v2/emotesv2_sub/static/dark/3.0',
          site: 'Twitch Subscriber',
        },
      ],
    });

    expect(result).toEqual<ParsedPart[]>([
      {
        type: 'emote',
        content: 'SubHype',
        id: 'emotesv2_sub',
        name: 'SubHype',
        original_name: 'SubHype',
        creator: null,
        emote_link:
          'https://static-cdn.jtvnw.net/emoticons/v2/emotesv2_sub/default/dark/3.0',
        url: 'https://static-cdn.jtvnw.net/emoticons/v2/emotesv2_sub/default/dark/3.0',
        static_url:
          'https://static-cdn.jtvnw.net/emoticons/v2/emotesv2_sub/static/dark/3.0',
        image_variants: {
          animated: {
            '2x': 'https://static-cdn.jtvnw.net/emoticons/v2/emotesv2_sub/default/dark/2.0',
            '4x': 'https://static-cdn.jtvnw.net/emoticons/v2/emotesv2_sub/default/dark/3.0',
          },
          static: {
            '2x': 'https://static-cdn.jtvnw.net/emoticons/v2/emotesv2_sub/static/dark/2.0',
            '4x': 'https://static-cdn.jtvnw.net/emoticons/v2/emotesv2_sub/static/dark/3.0',
          },
        },
        site: 'Twitch Subscriber',
      },
    ]);
  });
});
