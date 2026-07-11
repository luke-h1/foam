import { isUserBlocked } from '../isUserBlocked';

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
