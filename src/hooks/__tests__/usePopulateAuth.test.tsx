import { act, renderHook } from '@testing-library/react-native';
import { router } from 'expo-router';

import {
  type AuthContextState,
  useAuthContext,
} from '@app/context/AuthContext';

import { usePopulateAuth } from '../usePopulateAuth';

jest.mock('expo-router', () => ({
  router: {
    replace: jest.fn(),
  },
}));

jest.mock('@app/context/AuthContext', () => ({
  useAuthContext: jest.fn(),
}));

const mockedRouter = jest.mocked(router);
const mockedUseAuthContext = jest.mocked(useAuthContext);

const baseContext: Omit<AuthContextState, 'authState'> = {
  loginWithTwitch: jest.fn(),
  populateAuthState: jest.fn(),
  logout: jest.fn(),
  fetchAnonToken: jest.fn(),
  ready: true,
  user: undefined,
};

const setAuthState = (authState: AuthContextState['authState']) => {
  mockedUseAuthContext.mockReturnValue({ ...baseContext, authState });
};

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

describe('usePopulateAuth', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  test('does not navigate when hydrating straight into a logged-in state (app open)', () => {
    setAuthState(undefined);
    const { rerender } = renderHook(() => usePopulateAuth());

    setAuthState(loggedIn);
    rerender({});

    act(() => {
      jest.runAllTimers();
    });

    expect(mockedRouter.replace).not.toHaveBeenCalled();
  });

  test('navigates to following on a logged-out -> logged-in transition (sheet login)', () => {
    setAuthState(undefined);
    const { rerender } = renderHook(() => usePopulateAuth());

    setAuthState(anon);
    rerender({});

    setAuthState(loggedIn);
    rerender({});

    act(() => {
      jest.runAllTimers();
    });

    expect(mockedRouter.replace).toHaveBeenCalledTimes(1);
    expect(mockedRouter.replace).toHaveBeenCalledWith('/tabs/following');
  });

  test('does not navigate again while staying logged in (e.g. token refresh)', () => {
    setAuthState(anon);
    const { rerender } = renderHook(() => usePopulateAuth());

    setAuthState(loggedIn);
    rerender({});
    act(() => {
      jest.runAllTimers();
    });

    // New authState object with the same isLoggedIn, as produced by a refresh
    setAuthState({ ...loggedIn });
    rerender({});
    act(() => {
      jest.runAllTimers();
    });

    expect(mockedRouter.replace).toHaveBeenCalledTimes(1);
  });
});
