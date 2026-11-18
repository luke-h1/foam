import { unescapeIrcTag } from '../unescapeIrcTag';

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

  test('consumes an escaped backslash as one unit (no double-decode)', () => {
    expect(unescapeIrcTag(String.raw`path\\sfoo`)).toBe(String.raw`path\sfoo`);
  });

  test('drops a lone trailing backslash', () => {
    expect(unescapeIrcTag('end\\')).toBe('end');
  });

  test('yields the following character for an unknown escape', () => {
    expect(unescapeIrcTag(String.raw`a\xb`)).toBe('axb');
  });
});
