import type { TwemojiResult } from '../splitTextWithTwemoji';
import { splitTextWithTwemoji } from '../splitTextWithTwemoji';

const TWEMOJI_BASE =
  'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg';

describe('splitTextWithTwemoji', () => {
  test('splits plain text and emoji into segments', () => {
    expect(splitTextWithTwemoji('hello 😀 world')).toEqual<TwemojiResult>([
      { text: 'hello' },
      { emoji: '😀', image: `${TWEMOJI_BASE}/1f600.svg` },
      { text: 'world' },
    ]);
  });

  test('returns a single text segment when there are no emoji', () => {
    expect(splitTextWithTwemoji('just words')).toEqual<TwemojiResult>([
      { text: 'just words' },
    ]);
  });

  test('consumes the U+FE0F variation selector instead of leaking it into the next text segment', () => {
    expect(splitTextWithTwemoji('hi ❤️ there')).toEqual<TwemojiResult>([
      { text: 'hi' },
      { emoji: '❤️', image: `${TWEMOJI_BASE}/2764.svg` },
      { text: 'there' },
    ]);
  });

  test('does not corrupt surrounding text for keycap sequences', () => {
    const result = splitTextWithTwemoji('press 1️⃣ now');

    expect(result).toEqual<TwemojiResult>([
      { text: 'press' },
      { emoji: '1️⃣', image: `${TWEMOJI_BASE}/31-20e3.svg` },
      { text: 'now' },
    ]);
  });

  test('handles repeated variation-selector emoji', () => {
    expect(splitTextWithTwemoji('❤️❤️')).toEqual<TwemojiResult>([
      { emoji: '❤️', image: `${TWEMOJI_BASE}/2764.svg` },
      { emoji: '❤️', image: `${TWEMOJI_BASE}/2764.svg` },
    ]);
  });

  test('keeps ZWJ sequences intact', () => {
    const family = '👨‍👩‍👧';
    const result = splitTextWithTwemoji(`look ${family}!`);

    expect(result).toEqual<TwemojiResult>([
      { text: 'look' },
      {
        emoji: family,
        image: `${TWEMOJI_BASE}/1f468-200d-1f469-200d-1f467.svg`,
      },
      { text: '!' },
    ]);
  });
});
