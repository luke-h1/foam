import { isUpdateAppButtonAllowed } from '../isUpdateAppButtonAllowed';

describe('isUpdateAppButtonAllowed', () => {
  test('allows everyone when the list is empty', () => {
    expect(isUpdateAppButtonAllowed('anyone', [])).toBe(true);
    expect(isUpdateAppButtonAllowed(undefined, [])).toBe(true);
    expect(isUpdateAppButtonAllowed(null, [])).toBe(true);
  });

  test('allows a login present in the list', () => {
    expect(isUpdateAppButtonAllowed('user', ['user'])).toBe(true);
  });

  test('matches case-insensitively and ignores surrounding whitespace', () => {
    expect(isUpdateAppButtonAllowed('  USER ', ['user'])).toBe(true);
    expect(isUpdateAppButtonAllowed('user', ['  user  '])).toBe(true);
  });

  test('denies a login absent from a non-empty list', () => {
    expect(isUpdateAppButtonAllowed('someone_else', ['user'])).toBe(false);
  });

  test('denies a missing login when the list is non-empty', () => {
    expect(isUpdateAppButtonAllowed(undefined, ['user'])).toBe(false);
    expect(isUpdateAppButtonAllowed(null, ['user'])).toBe(false);
    expect(isUpdateAppButtonAllowed('', ['user'])).toBe(false);
  });
});
