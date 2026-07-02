import i18next from '@app/i18n/i18next';

describe('i18n', () => {
  test('initializes with English and resolves keys across namespaces', () => {
    expect(i18next.isInitialized).toBe(true);
    expect(i18next.language).toBe('en');
    expect(i18next.t('save')).toBe('Save');
    expect(i18next.t('tabs:following')).toBe('Following');
    expect(i18next.t('settings:signIn')).toBe('Sign In');
  });
});
