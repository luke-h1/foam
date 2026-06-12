import { splitTextWithTwemoji } from '../splitTextWithTwemoji';

const TWEMOJI_BASE =
  'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg';

describe('splitTextWithTwemoji', () => {
  it('splits plain text and emoji into segments', () => {
    expect(splitTextWithTwemoji('hello 😀 world')).toEqual([
      { text: 'hello' },
      { emoji: '😀', image: `${TWEMOJI_BASE}/1f600.svg` },
      { text: 'world' },
    ]);
  });

  it('returns a single text segment when there are no emoji', () => {
    expect(splitTextWithTwemoji('just words')).toEqual([
      { text: 'just words' },
    ]);
  });

  it('consumes the U+FE0F variation selector instead of leaking it into the next text segment', () => {
    expect(splitTextWithTwemoji('hi ❤️ there')).toEqual([
      { text: 'hi' },
      { emoji: '❤️', image: `${TWEMOJI_BASE}/2764.svg` },
      { text: 'there' },
    ]);
  });

  it('does not corrupt surrounding text for keycap sequences', () => {
    const result = splitTextWithTwemoji('press 1️⃣ now');

    expect(result).toEqual([
      { text: 'press' },
      { emoji: '1️⃣', image: `${TWEMOJI_BASE}/31-20e3.svg` },
      { text: 'now' },
    ]);
  });

  it('handles repeated variation-selector emoji', () => {
    expect(splitTextWithTwemoji('❤️❤️')).toEqual([
      { emoji: '❤️', image: `${TWEMOJI_BASE}/2764.svg` },
      { emoji: '❤️', image: `${TWEMOJI_BASE}/2764.svg` },
    ]);
  });

  it('keeps ZWJ sequences intact', () => {
    const family = '👨‍👩‍👧';
    const result = splitTextWithTwemoji(`look ${family}!`);

    expect(result[0]).toEqual({ text: 'look' });
    expect(result[1]?.emoji).toBe(family);
    expect(result[2]).toEqual({ text: '!' });
  });
});
