import { useState } from 'react';
import type { PropsWithChildren } from 'react';

import { act, renderHook, waitFor } from '@testing-library/react-native';
import { useAuthRequest } from 'expo-auth-session';
import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { toast } from 'sonner-native';

import { AuthContext, type AuthContextState } from '@app/context/auth-context';

import { useTwitchSignIn } from '../use-twitch-sign-in';
import {
  createTwitchSignInAuthRequest,
  createTwitchSignInAuthResult,
  createWebBrowserAuthSuccess,
} from './__fixtures__/use-twitch-sign-in.fixture';

jest.mock('expo-auth-session', () => {
  const actual =
    jest.requireActual<typeof import('expo-auth-session')>('expo-auth-session');

  return {
    ...actual,
    useAuthRequest: jest.fn(),
  };
});

const mockedUseAuthRequest = jest.mocked(useAuthRequest);

describe('useTwitchSignIn', () => {
  let openAuthSessionAsync: jest.SpiedFunction<
    typeof WebBrowser.openAuthSessionAsync
  >;

  beforeEach(() => {
    openAuthSessionAsync = jest.spyOn(WebBrowser, 'openAuthSessionAsync');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('completes a successful auth response once when auth context re-renders', async () => {
    const authResult = createTwitchSignInAuthResult('token-123');
    const request = createTwitchSignInAuthRequest(authResult);
    const loginWithTwitch = jest.fn();

    mockedUseAuthRequest.mockReturnValue([request, null, jest.fn()]);

    openAuthSessionAsync.mockResolvedValue(
      createWebBrowserAuthSuccess(authResult.url),
    );

    function Wrapper({ children }: PropsWithChildren) {
      const [version, setVersion] = useState(0);

      const contextValue: AuthContextState = {
        authState: undefined,
        user: undefined,
        fetchAnonToken: jest.fn(),
        loginWithTwitch: async response => {
          loginWithTwitch(response);
          setVersion(currentVersion => currentVersion + 1);
          return null;
        },
        logout: jest.fn(),
        populateAuthState: jest.fn(),
        ready: version >= 0,
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

    await waitFor(() =>
      expect(router.replace).toHaveBeenCalledWith('/tabs/following'),
    );

    expect(loginWithTwitch.mock.calls).toEqual([[authResult]]);
    expect(jest.mocked(toast.success).mock.calls).toEqual([['Logged in']]);
  });

  test('uses the success callback instead of navigating when provided', async () => {
    const authResult = createTwitchSignInAuthResult('token-456');
    const request = createTwitchSignInAuthRequest(authResult);
    const loginWithTwitch = jest.fn();
    const onSuccess = jest.fn();

    mockedUseAuthRequest.mockReturnValue([request, null, jest.fn()]);

    openAuthSessionAsync.mockResolvedValue(
      createWebBrowserAuthSuccess(authResult.url),
    );

    function Wrapper({ children }: PropsWithChildren) {
      const contextValue: AuthContextState = {
        authState: undefined,
        user: undefined,
        fetchAnonToken: jest.fn(),
        loginWithTwitch,
        logout: jest.fn(),
        populateAuthState: jest.fn(),
        ready: true,
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

    await waitFor(() => expect(onSuccess).toHaveBeenCalledTimes(1));

    expect(loginWithTwitch.mock.calls).toEqual([[authResult]]);
    expect(jest.mocked(toast.success).mock.calls).toEqual([['Logged in']]);
    expect(router.replace).not.toHaveBeenCalled();
  });
});
