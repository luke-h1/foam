import { isLoginInList } from '../isLoginInList';

describe('isLoginInList', () => {
  const admins = ['example_admin', 'Another_Admin'];

  test('matches a login on the remote-config admin list (case/space insensitive)', () => {
    expect(isLoginInList('example_admin', admins)).toBe(true);

    expect(isLoginInList('EXAMPLE_ADMIN', admins)).toBe(true);

    expect(isLoginInList('  example_admin  ', admins)).toBe(true);

    expect(isLoginInList('another_admin', admins)).toBe(true);
  });

  test('rejects non-admins and empty/missing logins', () => {
    expect(isLoginInList('someone_else', admins)).toBe(false);

    expect(isLoginInList('', admins)).toBe(false);

    expect(isLoginInList(undefined, admins)).toBe(false);

    expect(isLoginInList(null, admins)).toBe(false);
  });

  test('rejects everyone when the admin list is empty (repo default)', () => {
    expect(isLoginInList('example_admin', [])).toBe(false);
  });
});
