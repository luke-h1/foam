import {
  beginDeepLinkAuth,
  endDeepLinkAuth,
  isDeepLinkAuthInProgress,
} from '../deepLinkAuthState';

describe('deepLinkAuthState', () => {
  afterEach(() => {
    while (isDeepLinkAuthInProgress()) {
      endDeepLinkAuth();
    }
  });

  test('starts not in progress', () => {
    expect(isDeepLinkAuthInProgress()).toBe(false);
  });

  test('is in progress between begin and end', () => {
    beginDeepLinkAuth();
    expect(isDeepLinkAuthInProgress()).toBe(true);

    endDeepLinkAuth();
    expect(isDeepLinkAuthInProgress()).toBe(false);
  });

  test('stays in progress until every concurrent begin is ended', () => {
    beginDeepLinkAuth();
    beginDeepLinkAuth();

    endDeepLinkAuth();
    expect(isDeepLinkAuthInProgress()).toBe(true);

    endDeepLinkAuth();
    expect(isDeepLinkAuthInProgress()).toBe(false);
  });

  test('does not underflow below zero', () => {
    endDeepLinkAuth();
    endDeepLinkAuth();
    expect(isDeepLinkAuthInProgress()).toBe(false);

    beginDeepLinkAuth();
    expect(isDeepLinkAuthInProgress()).toBe(true);
  });
});
