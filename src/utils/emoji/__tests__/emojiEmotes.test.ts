import { getEmojiEmotes } from '../emojiEmotes';

describe('getEmojiEmotes', () => {
  test('uses Twitter-style URLs when requested', () => {
    const joy = getEmojiEmotes('twitter').find(emote => emote.name === ':joy:');

    expect(joy?.id).toBe('1F602:joy');
    expect(joy?.emoji_hexcode).toBe('1F602');
    expect(joy?.url).toBe(
      'https://cdn.jsdelivr.net/gh/jdecked/twemoji@50c7abfe6813680455781862f7b34305cd1eb9f5/assets/72x72/1f602.png',
    );
  });

  test('uses Google-style URLs when requested', () => {
    const joy = getEmojiEmotes('google').find(emote => emote.name === ':joy:');

    expect(joy?.id).toBe('1F602:joy');
    expect(joy?.emoji_hexcode).toBe('1F602');
    expect(joy?.url).toBe(
      'https://raw.githubusercontent.com/googlefonts/noto-emoji/main/png/72/emoji_u1f602.png',
    );
  });

  test('creates a unique id for every shortcode alias', () => {
    const emotes = getEmojiEmotes('twitter');
    const ids = emotes.map(emote => emote.id);

    expect(new Set(ids).size).toBe(ids.length);
    const aliasedJoyEmotes = emotes
      .filter(emote => emote.name === ':joy:' || emote.name === ':haha:')
      .map(emote => ({
        emoji_hexcode: emote.emoji_hexcode,
        id: emote.id,
        name: emote.name,
      }));
    expect(aliasedJoyEmotes).toEqual([
      {
        emoji_hexcode: '1F602',
        id: '1F602:joy',
        name: ':joy:',
      },
      {
        emoji_hexcode: '1F602',
        id: '1F602:haha',
        name: ':haha:',
      },
    ]);
  });
});
