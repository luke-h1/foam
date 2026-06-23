import { stripInvisibleChars } from '../stripInvisibleChars';

describe('stripInvisibleChars', () => {
  test('strips the combining grapheme joiner Twitch appends to dodge the duplicate filter', () => {
    expect(stripInvisibleChars('forsenE \u034F')).toEqual('forsenE ');
  });

  test('strips the Chatterino U+E0000 magic suffix and assorted zero-width chars', () => {
    expect(stripInvisibleChars('hi\u{E0000}')).toEqual('hi');
    expect(stripInvisibleChars('a\u200Bb\u2060c\uFEFFd\u180Ee')).toEqual(
      'abcde',
    );
  });

  test('preserves the zero-width joiner and variation selectors emoji depend on', () => {
    const family = '\u{1F468}\u200D\u{1F469}\u200D\u{1F467}';
    const heart = '\u2764\uFE0F';
    expect(stripInvisibleChars(family)).toEqual(family);
    expect(stripInvisibleChars(heart)).toEqual(heart);
  });

  test('leaves plain text untouched', () => {
    expect(stripInvisibleChars('hello world')).toEqual('hello world');
  });
});
