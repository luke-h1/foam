import { containsMutedWords, isUserBlocked } from '../chatMessageFilters';

describe('isUserBlocked', () => {
  const blocked = [{ userLogin: 'spammer' }];

  test('is false when the username is undefined', () => {
    expect(isUserBlocked(undefined, blocked)).toBe(false);
  });

  test('is false when the block list is empty', () => {
    expect(isUserBlocked('spammer', [])).toBe(false);
  });

  test('matches case-insensitively', () => {
    expect(isUserBlocked('Spammer', blocked)).toBe(true);
  });

  test('is false for a non-blocked user', () => {
    expect(isUserBlocked('friend', blocked)).toBe(false);
  });
});

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
