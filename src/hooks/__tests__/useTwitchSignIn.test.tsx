import { AuthContext, type AuthContextState } from '@app/context/AuthContext';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import { useState } from 'react';
import type { PropsWithChildren } from 'react';

import { toast } from 'sonner-native';
import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useAuthRequest } from 'expo-auth-session';
import {
  createTwitchSignInAuthRequest,
  createTwitchSignInAuthResult,
  createWebBrowserAuthSuccess,
} from './__fixtures__/useTwitchSignIn.fixture';
import { useTwitchSignIn } from '../useTwitchSignIn';

jest.mock('expo-constants', () => ({
  expoConfig: {
    extra: {
      EXPO_PUBLIC_AUTH_PROXY_API_BASE_URL: 'https://auth.example.com/api',
      EXPO_PUBLIC_TWITCH_CLIENT_ID: 'client-id',
    },
  },
}));

jest.mock('expo-auth-session', () => {
  const actual =
    jest.requireActual<typeof import('expo-auth-session')>('expo-auth-session');

  return {
    ...actual,
    useAuthRequest: jest.fn(),
  };
});

jest.mock('expo-web-browser', () => ({
  maybeCompleteAuthSession: jest.fn(),
  openAuthSessionAsync: jest.fn(),
}));

jest.mock('expo-router', () => ({
  router: {
    replace: jest.fn(),
  },
}));

jest.mock('sonner-native', () => ({
  toast: {
    error: jest.fn(),
    success: jest.fn(),
  },
}));

jest.mock('@app/lib/sentry', () => ({
  recordInfo: jest.fn(),
  recordWarning: jest.fn(),
}));

const mockedUseAuthRequest = jest.mocked(useAuthRequest);
const mockedOpenAuthSessionAsync = jest.mocked(WebBrowser.openAuthSessionAsync);
const mockedToast = jest.mocked(toast);
const mockedRouter = jest.mocked(router);

describe('useTwitchSignIn', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('completes a successful auth response once when auth context re-renders', async () => {
    const authResult = createTwitchSignInAuthResult('token-123');
    const request = createTwitchSignInAuthRequest(authResult);
    const loginWithTwitch = jest.fn();

    mockedUseAuthRequest.mockReturnValue([request, null, jest.fn()]);
    mockedOpenAuthSessionAsync.mockResolvedValue(
      createWebBrowserAuthSuccess(authResult.url),
    );

    function Wrapper({ children }: PropsWithChildren) {
      const [version, setVersion] = useState(0);

      const contextValue: AuthContextState = {
        authState: undefined,
        fetchAnonToken: jest.fn(),
        loginWithTwitch: async response => {
          loginWithTwitch(response);
          setVersion(currentVersion => currentVersion + 1);
          return null;
        },
        logout: jest.fn(),
        populateAuthState: jest.fn(),
        ready: version >= 0,
        user: undefined,
      };

      return (
        <AuthContext.Provider value={contextValue}>
          {children}
        </AuthContext.Provider>
      );
    }

    const { result } = renderHook(() => useTwitchSignIn(), {
      wrapper: Wrapper,
    });

    await act(async () => {
      await result.current.startSignIn();
    });

    await waitFor(() => {
      expect(loginWithTwitch).toHaveBeenCalledTimes(1);
      expect(mockedToast.success).toHaveBeenCalledTimes(1);
      expect(mockedRouter.replace).toHaveBeenCalledWith('/tabs/following');
    });
  });

  it('uses the success callback instead of navigating when provided', async () => {
    const authResult = createTwitchSignInAuthResult('token-456');
    const request = createTwitchSignInAuthRequest(authResult);
    const loginWithTwitch = jest.fn();
    const onSuccess = jest.fn();

    mockedUseAuthRequest.mockReturnValue([request, null, jest.fn()]);
    mockedOpenAuthSessionAsync.mockResolvedValue(
      createWebBrowserAuthSuccess(authResult.url),
    );

    function Wrapper({ children }: PropsWithChildren) {
      const contextValue: AuthContextState = {
        authState: undefined,
        fetchAnonToken: jest.fn(),
        loginWithTwitch,
        logout: jest.fn(),
        populateAuthState: jest.fn(),
        ready: true,
        user: undefined,
      };

      return (
        <AuthContext.Provider value={contextValue}>
          {children}
        </AuthContext.Provider>
      );
    }

    const { result } = renderHook(() => useTwitchSignIn({ onSuccess }), {
      wrapper: Wrapper,
    });

    await act(async () => {
      await result.current.startSignIn();
    });

    await waitFor(() => {
      expect(loginWithTwitch).toHaveBeenCalledTimes(1);
      expect(onSuccess).toHaveBeenCalledTimes(1);
      expect(mockedRouter.replace).not.toHaveBeenCalled();
    });
  });
});
