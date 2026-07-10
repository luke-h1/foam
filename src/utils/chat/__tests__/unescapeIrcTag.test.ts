import { unescapeIrcTag } from '../unescapeIrcTag';

describe('unescapeIrcTag', () => {
  test('returns the value unchanged when there is nothing to decode', () => {
    expect(unescapeIrcTag('ModUser is here')).toBe('ModUser is here');
    expect(unescapeIrcTag('')).toBe('');
  });

  test('decodes the IRCv3 escape table', () => {
    expect(unescapeIrcTag('a\\sb')).toBe('a b');
    expect(unescapeIrcTag('a\\:b')).toBe('a;b');
    expect(unescapeIrcTag('a\\\\b')).toBe('a\\b');
    expect(unescapeIrcTag('a\\nb')).toBe('a\nb');
    expect(unescapeIrcTag('a\\rb')).toBe('a\rb');
    expect(unescapeIrcTag('a\\tb')).toBe('a\tb');
  });

  test('decodes a full system-msg', () => {
    expect(
      unescapeIrcTag('ModUser\\sis\\scelebrating\\s24\\smonths!'),
    ).toBe('ModUser is celebrating 24 months!');
  });

  test('consumes an escaped backslash as one unit (no double-decode)', () => {
    // Wire `\\s` is an escaped backslash then a literal `s`, i.e. the text
    // `\s` — never a space.
    expect(unescapeIrcTag('path\\\\sfoo')).toBe('path\\sfoo');
  });

  test('drops a lone trailing backslash', () => {
    expect(unescapeIrcTag('end\\')).toBe('end');
  });

  test('yields the following character for an unknown escape', () => {
    expect(unescapeIrcTag('a\\xb')).toBe('axb');
  });
});
