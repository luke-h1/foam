import { replaceTextWithEmotes } from '../replaceTextWithEmotes';
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

    expect(
      result.map(part => ({
        content: 'content' in part ? part.content : undefined,
        name: part.type === 'emote' ? part.name : undefined,
        original_name: part.type === 'emote' ? part.original_name : undefined,
        type: part.type,
      })),
    ).toEqual([
      {
        content: 'hello',
        name: undefined,
        original_name: undefined,
        type: 'text',
      },
      { content: ' ', name: undefined, original_name: undefined, type: 'text' },
      {
        content: ':joy:',
        name: ':joy:',
        original_name: ':joy:',
        type: 'emote',
      },
      { content: ' ', name: undefined, original_name: undefined, type: 'text' },
      {
        content: ':haha:',
        name: ':haha:',
        original_name: ':haha:',
        type: 'emote',
      },
    ]);
  });

  test('matches direct unicode emoji and preserves the original character', () => {
    const result = replaceTextWithEmotes({
      ...emptyParams,
      inputString: '😂',
    });

    expect(
      result.map(part => ({
        content: 'content' in part ? part.content : undefined,
        name: part.type === 'emote' ? part.name : undefined,
        original_name: part.type === 'emote' ? part.original_name : undefined,
        type: part.type,
      })),
    ).toEqual([
      {
        content: '😂',
        name: ':joy:',
        original_name: '😂',
        type: 'emote',
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

    expect(
      result.map(part => ({
        content: 'content' in part ? part.content : undefined,
        id: part.type === 'emote' ? part.id : undefined,
        site: part.type === 'emote' ? part.site : undefined,
        type: part.type,
      })),
    ).toEqual([
      {
        content: 'SubHype',
        id: 'emotesv2_sub',
        site: 'Twitch Subscriber',
        type: 'emote',
      },
    ]);
  });
});
