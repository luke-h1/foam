import { isAdminLogin } from '../devToolsGate';

describe('isAdminLogin', () => {
  const admins = ['example_admin', 'Another_Admin'];

  test('matches a login on the remote-config admin list (case/space insensitive)', () => {
    expect(isAdminLogin('example_admin', admins)).toBe(true);
    expect(isAdminLogin('EXAMPLE_ADMIN', admins)).toBe(true);
    expect(isAdminLogin('  example_admin  ', admins)).toBe(true);
    expect(isAdminLogin('another_admin', admins)).toBe(true);
  });

  test('rejects non-admins and empty/missing logins', () => {
    expect(isAdminLogin('someone_else', admins)).toBe(false);
    expect(isAdminLogin('', admins)).toBe(false);
    expect(isAdminLogin(undefined, admins)).toBe(false);
    expect(isAdminLogin(null, admins)).toBe(false);
  });

  test('rejects everyone when the admin list is empty (repo default)', () => {
    expect(isAdminLogin('example_admin', [])).toBe(false);
  });
});
