import type { PropsWithChildren } from 'react';

import { act, renderHook, waitFor } from '@testing-library/react-native';
import { useAuthRequest } from 'expo-auth-session';
import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { toast } from 'sonner-native';

import {
  AuthContext,
  type AuthContextState,
  type LoginWithTwitchResult,
} from '@app/context/AuthContext';

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

  function renderSignIn(
    loginWithTwitch: AuthContextState['loginWithTwitch'],
    onSuccess = jest.fn(),
  ) {
    function Wrapper({ children }: PropsWithChildren) {
      const contextValue: AuthContextState = {
        authState: undefined,
        user: undefined,
        loginWithTwitch,
        logout: jest.fn(),
        ready: true,
        signInId: 0,
      };

      return (
        <AuthContext.Provider value={contextValue}>
          {children}
        </AuthContext.Provider>
      );
    }

    return renderHook(() => useTwitchSignIn({ onSuccess }), {
      wrapper: Wrapper,
    });
  }

  test('shows the success toast and calls onSuccess once on a successful sign-in', async () => {
    const authResult = createTwitchSignInAuthResult('token-456');
    const request = createTwitchSignInAuthRequest(authResult);
    const onSuccess = jest.fn();

    const loginWithTwitch = jest.fn(
      async (): Promise<LoginWithTwitchResult> => ({ ok: true }),
    );

    mockedUseAuthRequest.mockReturnValue([request, null, jest.fn()]);

    openAuthSessionAsync.mockResolvedValue(
      createWebBrowserAuthSuccess(authResult.url),
    );

    const { result } = renderSignIn(loginWithTwitch, onSuccess);

    await act(async () => {
      await result.current.startSignIn();
    });

    await waitFor(() => expect(onSuccess).toHaveBeenCalledTimes(1));

    expect(loginWithTwitch.mock.calls).toEqual([[authResult]]);

    expect(jest.mocked(toast.success).mock.calls).toEqual([['Logged in']]);

    expect(router.replace).not.toHaveBeenCalled();
  });

  test('shows no toast and does not call onSuccess when the user cancels', async () => {
    const request = createTwitchSignInAuthRequest(
      createTwitchSignInAuthResult('unused'),
    );

    const onSuccess = jest.fn();

    const loginWithTwitch = jest.fn(
      async (): Promise<LoginWithTwitchResult> => ({
        ok: false,
        reason: 'cancelled',
      }),
    );

    mockedUseAuthRequest.mockReturnValue([request, null, jest.fn()]);
    openAuthSessionAsync.mockResolvedValue({
      type: WebBrowser.WebBrowserResultType.CANCEL,
    });

    const { result } = renderSignIn(loginWithTwitch, onSuccess);

    await act(async () => {
      await result.current.startSignIn();
    });

    expect(loginWithTwitch.mock.calls).toEqual([[{ type: 'cancel' }]]);

    expect(toast.success).not.toHaveBeenCalled();

    expect(toast.error).not.toHaveBeenCalled();

    expect(onSuccess).not.toHaveBeenCalled();

    expect(router.replace).not.toHaveBeenCalled();
  });

  test('does not report success or navigate when the login fails', async () => {
    const authResult = createTwitchSignInAuthResult('token-789');
    const request = createTwitchSignInAuthRequest(authResult);
    const onSuccess = jest.fn();

    const loginWithTwitch = jest.fn(
      async (): Promise<LoginWithTwitchResult> => ({
        ok: false,
        reason: 'error',
      }),
    );

    mockedUseAuthRequest.mockReturnValue([request, null, jest.fn()]);

    openAuthSessionAsync.mockResolvedValue(
      createWebBrowserAuthSuccess(authResult.url),
    );

    const { result } = renderSignIn(loginWithTwitch, onSuccess);

    await act(async () => {
      await result.current.startSignIn();
    });

    expect(loginWithTwitch).toHaveBeenCalledTimes(1);

    expect(toast.success).not.toHaveBeenCalled();

    expect(onSuccess).not.toHaveBeenCalled();

    expect(router.replace).not.toHaveBeenCalled();
  });
});
