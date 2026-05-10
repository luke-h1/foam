import { getEmojiEmotes } from '../emojiEmotes';

describe('getEmojiEmotes', () => {
  test('uses Twitter-style URLs when requested', () => {
    const joy = getEmojiEmotes('twitter').find(
      emote => emote.id === '1F602' && emote.name === ':joy:',
    );

    expect(joy?.url).toBe(
      'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f602.png',
    );
  });

  test('uses Google-style URLs when requested', () => {
    const joy = getEmojiEmotes('google').find(
      emote => emote.id === '1F602' && emote.name === ':joy:',
    );

    expect(joy?.url).toBe(
      'https://raw.githubusercontent.com/googlefonts/noto-emoji/main/png/72/emoji_u1f602.png',
    );
  });
});
