import { act, render } from '@testing-library/react-native';
import { router } from 'expo-router';

import { createAuthContextValue } from '@app/context/__tests__/__fixtures__/auth-context.fixture';
import {
  type AuthContextState,
  AuthContextTestProvider,
} from '@app/context/auth-context';
import {
  beginDeepLinkAuth,
  endDeepLinkAuth,
} from '@app/navigators/deep-link-auth-state';

import { usePopulateAuth } from '../use-populate-auth';

const loggedIn: AuthContextState['authState'] = {
  isAnonAuth: false,
  isLoggedIn: true,
  token: {
    accessToken: 'token',
    expiresIn: 3600,
    tokenType: 'bearer',
    expiresAt: Date.now() + 3_600_000,
  },
};

const anon: AuthContextState['authState'] = {
  isAnonAuth: true,
  isLoggedIn: false,
  token: {
    accessToken: 'anon',
    expiresIn: 3600,
    tokenType: 'bearer',
    expiresAt: Date.now() + 3_600_000,
  },
};

function PopulateAuthProbe() {
  usePopulateAuth();
  return null;
}

function withAuthState(authState: AuthContextState['authState']) {
  return (
    <AuthContextTestProvider {...createAuthContextValue({ authState })}>
      <PopulateAuthProbe />
    </AuthContextTestProvider>
  );
}

function runTimers() {
  act(() => {
    jest.runAllTimers();
  });
}

describe('usePopulateAuth', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  test('does not navigate when hydrating straight into a logged-in state (app open)', () => {
    const { rerender } = render(withAuthState(undefined));

    rerender(withAuthState(loggedIn));
    runTimers();

    expect(router.replace).not.toHaveBeenCalled();
  });

  test('navigates to following on a logged-out -> logged-in transition (sheet login)', () => {
    const { rerender } = render(withAuthState(undefined));

    rerender(withAuthState(anon));
    rerender(withAuthState(loggedIn));
    runTimers();

    expect(jest.mocked(router.replace).mock.calls).toEqual([
      ['/tabs/following'],
    ]);
  });

  test('does not navigate on a magic-link login (RouterEffects handles it)', () => {
    beginDeepLinkAuth();

    try {
      const { rerender } = render(withAuthState(undefined));

      rerender(withAuthState(anon));
      rerender(withAuthState(loggedIn));
      runTimers();
    } finally {
      endDeepLinkAuth();
    }

    expect(router.replace).not.toHaveBeenCalled();
  });

  test('does not navigate again while staying logged in (e.g. token refresh)', () => {
    const { rerender } = render(withAuthState(anon));

    rerender(withAuthState(loggedIn));
    runTimers();

    // New authState object with the same isLoggedIn, as produced by a refresh
    rerender(withAuthState({ ...loggedIn }));
    runTimers();

    expect(jest.mocked(router.replace).mock.calls).toEqual([
      ['/tabs/following'],
    ]);
  });
});
