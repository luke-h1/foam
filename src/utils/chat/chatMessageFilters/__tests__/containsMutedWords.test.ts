import { containsMutedWords } from '../containsMutedWords';

describe('containsMutedWords', () => {
  test('is false when there are no muted words', () => {
    expect(containsMutedWords('anything', [], true)).toBe(false);
  });

  test('matches a whole-word token case-insensitively', () => {
    expect(containsMutedWords('hello SPOILER world', ['spoiler'], true)).toBe(
      true,
    );
  });

  test('does not match a substring when matching whole words', () => {
    expect(containsMutedWords('spoilers ahead', ['spoiler'], true)).toBe(false);
  });

  test('matches a substring anywhere when not matching whole words', () => {
    expect(containsMutedWords('spoiler', ['spoiler'], false)).toBe(true);
    expect(containsMutedWords('spoiler ahead', ['spoiler'], false)).toBe(true);
    expect(containsMutedWords('big SPOILERS ahead', ['spoiler'], false)).toBe(
      true,
    );
    expect(containsMutedWords('spoiled ahead', ['spoiler'], false)).toBe(false);
  });
});
