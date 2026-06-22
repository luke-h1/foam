import { containsMutedWords, isUserBlocked } from '../chatMessageFilters';

describe('isUserBlocked', () => {
  const blocked = [{ userLogin: 'spammer' }];

  it('is false when the username is undefined', () => {
    expect(isUserBlocked(undefined, blocked)).toBe(false);
  });

  it('is false when the block list is empty', () => {
    expect(isUserBlocked('spammer', [])).toBe(false);
  });

  it('matches case-insensitively', () => {
    expect(isUserBlocked('Spammer', blocked)).toBe(true);
  });

  it('is false for a non-blocked user', () => {
    expect(isUserBlocked('friend', blocked)).toBe(false);
  });
});

describe('containsMutedWords', () => {
  it('is false when there are no muted words', () => {
    expect(containsMutedWords('anything', [], true)).toBe(false);
  });

  it('matches a whole-word token case-insensitively', () => {
    expect(containsMutedWords('hello SPOILER world', ['spoiler'], true)).toBe(
      true,
    );
  });

  it('does not match a substring when matching whole words', () => {
    expect(containsMutedWords('spoilers ahead', ['spoiler'], true)).toBe(false);
  });

  it('compares the whole message when not matching whole words', () => {
    expect(containsMutedWords('spoiler', ['spoiler'], false)).toBe(true);
    expect(containsMutedWords('spoiler ahead', ['spoiler'], false)).toBe(false);
  });
});
