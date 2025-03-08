import {
  twitchService as _twitchService,
  type UserInfoResponse,
} from '@app/services/twitchService';
import { waitFor, renderHook } from '@testing-library/react-native';
import type { AuthSessionResult } from 'expo-auth-session';
import * as _SecureStore from 'expo-secure-store';
import React, { act, type FC, type PropsWithChildren } from 'react';
import {
  AuthContextProvider,
  type AuthContextProviderProps,
  type AuthContextState,
  type TwitchToken,
  useAuthContext,
} from '../AuthContext';

jest.mock('@app/services/twitchService');
jest.mock('expo-secure-store');

jest.mock('@react-native-firebase/crashlytics', () => {
  return {
    __esModule: true,
    crashlytics: jest.fn(() => ({
      log: jest.fn(),
      recordError: jest.fn(),
    })),
  };
});
export const initalTestAuthContextProps: AuthContextState = {
  loginWithTwitch: jest.fn(),
  logout: jest.fn(),
  fetchAnonToken: jest.fn(),
  ready: true,
  populateAuthState: jest.fn(),
  user: undefined,
  authState: undefined,
};

const twitchService = jest.mocked(_twitchService);
const SecureStore = jest.mocked(_SecureStore);

describe('AuthContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const initialProps: AuthContextState = {
    ...initalTestAuthContextProps,
  };

  const wrapper: FC<PropsWithChildren & AuthContextProviderProps> = ({
    enableTestResult,
    testResult,
    ...props
  }) => (
    <AuthContextProvider
      enableTestResult={enableTestResult}
      testResult={testResult}
    >
      {props.children}
    </AuthContextProvider>
  );

  test('should populate auth state with anon token when no tokens are found', async () => {
    twitchService.getDefaultToken.mockResolvedValue({
      access_token: 'anon',
      expires_in: 3600,
      token_type: 'bearer',
    });

    SecureStore.getItemAsync.mockResolvedValue(null);

    const { result } = renderHook(() => useAuthContext(), {
      wrapper,
      initialProps,
    });

    await waitFor(() => {
      expect(result.current.authState).toEqual({
        isAnonAuth: true,
        isLoggedIn: false,
        token: { accessToken: 'anon', expiresIn: 3600, tokenType: 'bearer' },
      });

      expect(result.current.ready).toBe(true);
      expect(result.current.user).toEqual(undefined);
    });
  });

  test('should login with twitch when oauth response is succesful', async () => {
    const user: UserInfoResponse = {
      id: '123',
      login: 'test_user',
      display_name: 'Test User',
      type: '',
      broadcaster_type: '',
      description: '',
      profile_image_url: '',
      offline_image_url: '',
      view_count: 0,
      created_at: '',
    };

    const succesfulOauthResponse: AuthSessionResult = {
      type: 'success',
      params: {},
      url: '',
      error: undefined,
      authentication: {
        accessToken: 'user-token',
        expiresIn: 3600,
        tokenType: 'bearer',
      },
    } as AuthSessionResult;
    twitchService.getUserInfo.mockResolvedValue(user);

    const { result } = renderHook(() => useAuthContext(), {
      wrapper,
      initialProps: {
        ...initialProps,
        ready: true,
      },
    });

    await waitFor(async () => {
      expect(result.current.ready).toEqual(true);
    });

    await act(async () => {
      await result.current.loginWithTwitch(succesfulOauthResponse);
    });

    await waitFor(async () => {
      expect(result.current.user).toEqual(user);
      expect(result.current.authState?.isAnonAuth).toBe(false);
      expect(result.current.authState?.isLoggedIn).toBe(true);

      expect(result.current.authState).toEqual({
        isAnonAuth: false,
        isLoggedIn: true,
        token: {
          accessToken: 'user-token',
          expiresIn: 3600,
          tokenType: 'bearer',
        },
      });

      // 1 for inital anon auth when app boots and the 2nd is for when the user logs in
      expect(SecureStore.setItemAsync).toHaveBeenCalledTimes(2);

      const anonToken: TwitchToken = {
        accessToken: 'anon',
        expiresIn: 3600,
        tokenType: 'bearer',
      };

      expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
        'V1_foam-anon',
        JSON.stringify(anonToken),
      );

      const userToken: TwitchToken = {
        accessToken: 'user-token',
        expiresIn: 3600,
        tokenType: 'bearer',
      };

      expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
        'V1_foam-user',
        JSON.stringify(userToken),
      );
    });
  });

  test('should handle anonymous token expiration and refresh', async () => {
    const user: UserInfoResponse = {
      id: '123',
      login: 'test_user',
      display_name: 'Test User',
      type: '',
      broadcaster_type: '',
      description: '',
      profile_image_url: '',
      offline_image_url: '',
      view_count: 0,
      created_at: '',
    };

    twitchService.getDefaultToken.mockResolvedValue({
      access_token: 'anon-token',
      expires_in: 3600,
      token_type: 'bearer',
    });

    twitchService.getRefreshToken.mockResolvedValue({
      access_token: 'new-anon-token',
      expires_in: 3600,
      token_type: 'bearer',
      refresh_token: 'new-refresh-token',
      scope: '',
    });

    SecureStore.getItemAsync.mockResolvedValue(
      JSON.stringify({
        accessToken: 'anon-token',
        expiresIn: 3600,
        tokenType: 'bearer',
      }),
    );

    const { result } = renderHook(() => useAuthContext(), {
      wrapper,
      initialProps: {
        ...initialProps,
        user,
        authState: {
          token: {
            expiresIn: 3600,
          },
        },
      },
    });

    await waitFor(async () => {
      expect(result.current.ready).toEqual(true);
    });

    expect(result.current.authState?.isAnonAuth).toBe(true);
    expect(result.current.authState?.isLoggedIn).toBe(false);
  });
});
