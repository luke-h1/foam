import { unescapeIrcTag } from '../unescape-irc-tag';

describe('unescapeIrcTag', () => {
  test('returns the value unchanged when there is nothing to decode', () => {
    expect(unescapeIrcTag('ModUser is here')).toBe('ModUser is here');

    expect(unescapeIrcTag('')).toBe('');
  });

  test('decodes the IRCv3 escape table', () => {
    expect(unescapeIrcTag(String.raw`a\sb`)).toBe('a b');

    expect(unescapeIrcTag(String.raw`a\:b`)).toBe('a;b');

    expect(unescapeIrcTag(String.raw`a\\b`)).toBe(String.raw`a\b`);

    expect(unescapeIrcTag(String.raw`a\nb`)).toBe('a\nb');

    expect(unescapeIrcTag(String.raw`a\rb`)).toBe('a\rb');

    expect(unescapeIrcTag(String.raw`a\tb`)).toBe('a\tb');
  });

  test('decodes a full system-msg', () => {
    expect(
      unescapeIrcTag(String.raw`ModUser\sis\scelebrating\s24\smonths!`),
    ).toBe('ModUser is celebrating 24 months!');
  });

  test('consumes an escaped backslash as one unit (no double-decode)', () => {
    // Wire `\\s` is an escaped backslash then a literal `s`, i.e. the text
    // `\s` - never a space.
    expect(unescapeIrcTag(String.raw`path\\sfoo`)).toBe(String.raw`path\sfoo`);
  });

  test('drops a lone trailing backslash', () => {
    expect(unescapeIrcTag('end\\')).toBe('end');
  });

  test('yields the following character for an unknown escape', () => {
    expect(unescapeIrcTag(String.raw`a\xb`)).toBe('axb');
  });
});
