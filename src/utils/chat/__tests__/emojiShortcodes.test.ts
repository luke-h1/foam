import { replaceTextWithEmotes } from '../replaceTextWithEmotes';

describe('emoji shortcode parsing', () => {
  const emojiEmotes = [
    {
      id: '1F602',
      name: ':joy:',
      original_name: ':joy:',
      creator: null,
      emote_link: '',
      url: 'https://example.com/joy.png',
      static_url: 'https://example.com/joy.png',
      site: 'Emoji' as const,
      width: 72,
      height: 72,
      aspect_ratio: 1,
      zero_width: false,
    },
    {
      id: '1F602',
      name: ':haha:',
      original_name: ':haha:',
      creator: null,
      emote_link: '',
      url: 'https://example.com/joy.png',
      static_url: 'https://example.com/joy.png',
      site: 'Emoji' as const,
      width: 72,
      height: 72,
      aspect_ratio: 1,
      zero_width: false,
    },
  ];

  const emptyParams = {
    userstate: null,
    emojiEmotes,
    sevenTvGlobalEmotes: [],
    sevenTvChannelEmotes: [],
    sevenTvPersonalEmotes: [],
    twitchGlobalEmotes: [],
    twitchChannelEmotes: [],
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

    expect(result).toEqual([
      { type: 'text', content: 'hello' },
      { type: 'text', content: ' ' },
      expect.objectContaining({
        type: 'emote',
        name: ':joy:',
        original_name: ':joy:',
      }),
      { type: 'text', content: ' ' },
      expect.objectContaining({
        type: 'emote',
        name: ':haha:',
        original_name: ':haha:',
      }),
    ]);
  });

  test('matches direct unicode emoji and preserves the original character', () => {
    const result = replaceTextWithEmotes({
      ...emptyParams,
      inputString: '😂',
    });

    expect(result).toEqual([
      expect.objectContaining({
        type: 'emote',
        name: ':joy:',
        content: '😂',
        original_name: '😂',
      }),
    ]);
  });
});
