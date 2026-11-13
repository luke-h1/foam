import { act, render } from '@testing-library/react-native';
import { router, useSegments } from 'expo-router';

import { createAuthContextValue } from '@app/context/__tests__/__fixtures__/auth-context.fixture';
import {
  type AuthContextState,
  AuthContextTestProvider,
} from '@app/context/AuthContext';

import { useIsRouterReady } from '../use-is-router-ready';
import { usePopulateAuth } from '../use-populate-auth';

jest.mock('@app/hooks/use-is-router-ready', () => ({
  useIsRouterReady: jest.fn(() => true),
}));

const mockedUseIsRouterReady = jest.mocked(useIsRouterReady);

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

function PopulateAuthProbe() {
  usePopulateAuth();
  return null;
}

function withAuth(overrides: Partial<AuthContextState>) {
  return (
    <AuthContextTestProvider {...createAuthContextValue(overrides)}>
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
    mockedUseIsRouterReady.mockReturnValue(true);
    jest.mocked(useSegments).mockReturnValue(['tabs', 'following']);
  });

  test('does not navigate when a stored session is restored at startup', () => {
    const { rerender } = render(withAuth({ authState: undefined }));

    rerender(withAuth({ authState: loggedIn }));
    runTimers();

    expect(router.replace).not.toHaveBeenCalled();
  });

  test('navigates to following once when a sign-in completes', () => {
    const { rerender } = render(withAuth({ signInId: 0 }));

    rerender(withAuth({ authState: loggedIn, signInId: 1 }));
    runTimers();

    expect(jest.mocked(router.replace).mock.calls).toEqual([
      ['/tabs/following'],
    ]);
  });

  test('does not navigate again while the sign-in stays the same (e.g. token refresh)', () => {
    const { rerender } = render(withAuth({ signInId: 0 }));

    rerender(withAuth({ authState: loggedIn, signInId: 1 }));
    runTimers();

    rerender(withAuth({ authState: { ...loggedIn }, signInId: 1 }));
    runTimers();

    expect(jest.mocked(router.replace).mock.calls).toEqual([
      ['/tabs/following'],
    ]);
  });

  test('waits for the router to mount before it navigates', () => {
    mockedUseIsRouterReady.mockReturnValue(false);

    const { rerender } = render(withAuth({ signInId: 0 }));

    rerender(withAuth({ authState: loggedIn, signInId: 1 }));
    runTimers();

    expect(router.replace).not.toHaveBeenCalled();

    mockedUseIsRouterReady.mockReturnValue(true);
    rerender(withAuth({ authState: loggedIn, signInId: 1 }));

    expect(jest.mocked(router.replace).mock.calls).toEqual([
      ['/tabs/following'],
    ]);
  });

  test('waits for the auth sheet to close before it navigates', () => {
    jest.mocked(useSegments).mockReturnValue(['auth-sheet']);

    const { rerender } = render(withAuth({ signInId: 0 }));

    rerender(withAuth({ authState: loggedIn, signInId: 1 }));
    runTimers();

    expect(router.replace).not.toHaveBeenCalled();

    jest.mocked(useSegments).mockReturnValue(['tabs', 'following']);
    rerender(withAuth({ authState: loggedIn, signInId: 1 }));

    expect(jest.mocked(router.replace).mock.calls).toEqual([
      ['/tabs/following'],
    ]);
  });
});
