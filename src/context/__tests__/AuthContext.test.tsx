import { Typography } from '@app/components';
import { twitchApi as _twitchApi } from '@app/services/api';
import {
  twitchService as _twitchService,
  type UserInfoResponse,
} from '@app/services/twitch-service';
import {
  waitFor,
  renderHook,
  render,
  screen,
} from '@testing-library/react-native';
import type { AuthSessionResult } from 'expo-auth-session';
import * as _SecureStore from 'expo-secure-store';
import { act, type FC, type PropsWithChildren } from 'react';
import {
  AuthContextProvider,
  type AuthContextProviderProps,
  type AuthContextState,
  type TwitchToken,
  useAuthContext,
} from '../AuthContext';

jest.mock('@app/services/twitchService');
jest.mock('@app/services/api');
jest.mock('expo-secure-store');

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
const twitchApi = jest.mocked(_twitchApi);

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

  test('should login with twitch when oauth response is successful', async () => {
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

    await waitFor(() => {
      expect(result.current.ready).toEqual(true);
    });

    await act(async () => {
      await result.current.loginWithTwitch(succesfulOauthResponse);
    });

    await waitFor(() => {
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

    await waitFor(() => {
      expect(result.current.ready).toEqual(true);
    });

    expect(result.current.authState?.isAnonAuth).toBe(true);
    expect(result.current.authState?.isLoggedIn).toBe(false);
  });

  describe('App startup', () => {
    const TestComponent = () => {
      const { authState, user } = useAuthContext();
      return (
        <>
          <Typography>{authState?.isAnonAuth ? 'Anon' : 'User'}</Typography>
          <Typography>{user ? user.display_name : 'No User'}</Typography>
        </>
      );
    };
    test('grants an anon token if user has no anon token and no user token', async () => {
      SecureStore.getItemAsync.mockResolvedValueOnce(null);
      SecureStore.getItemAsync.mockResolvedValueOnce(null);
      twitchService.getDefaultToken.mockResolvedValueOnce({
        access_token: 'anon_access_token',
        expires_in: 3600,
        token_type: 'bearer',
      });

      const { getByText } = render(
        <AuthContextProvider>
          <TestComponent />
        </AuthContextProvider>,
      );

      await waitFor(() => {
        expect(getByText('Anon')).toBeOnTheScreen();
      });
    });

    test('checks if anon token is valid and sets the right state if valid', async () => {
      SecureStore.getItemAsync.mockResolvedValueOnce(
        JSON.stringify({
          accessToken: 'anon_access_token',
          expiresIn: 3600,
          tokenType: 'bearer',
        }),
      );
      SecureStore.getItemAsync.mockResolvedValueOnce(null);
      twitchService.validateToken.mockResolvedValueOnce(true);

      render(
        <AuthContextProvider>
          <TestComponent />
        </AuthContextProvider>,
      );

      await waitFor(() => {
        expect(screen.getByText('Anon')).toBeOnTheScreen();
      });
    });

    test('handles invalid anon token', async () => {
      SecureStore.getItemAsync.mockResolvedValueOnce(
        JSON.stringify({
          accessToken: 'invalid_anon_access_token',
          expiresIn: 3600,
          tokenType: 'bearer',
        }),
      );
      SecureStore.getItemAsync.mockResolvedValueOnce(null);
      twitchService.validateToken.mockResolvedValueOnce(false);
      twitchService.getDefaultToken.mockResolvedValueOnce({
        access_token: 'new_anon_access_token',
        expires_in: 3600,
        token_type: 'bearer',
      });

      render(
        <AuthContextProvider>
          <TestComponent />
        </AuthContextProvider>,
      );

      await waitFor(() => {
        // eslint-disable-next-line @typescript-eslint/unbound-method
        expect(twitchApi.setAuthToken).toHaveBeenCalledWith(
          'new_anon_access_token',
        );
        expect(screen.getByText('Anon')).toBeOnTheScreen();
      });
    });

    test('checks if auth token is valid and sets the right state if valid', async () => {
      SecureStore.getItemAsync.mockResolvedValueOnce(null);
      SecureStore.getItemAsync.mockResolvedValueOnce(
        JSON.stringify({
          accessToken: 'auth_access_token',
          expiresIn: 3600,
          tokenType: 'bearer',
        }),
      );
      twitchService.validateToken.mockResolvedValueOnce(true);
      twitchService.getUserInfo.mockResolvedValueOnce({
        display_name: 'Test User',
        broadcaster_type: 'streamer',
        created_at: '2024',
        description: 'test',
        id: '123',
        login: 'test_user',
        offline_image_url: '',
        profile_image_url: '',
        type: 'test',
        view_count: 123,
      });

      render(
        <AuthContextProvider>
          <TestComponent />
        </AuthContextProvider>,
      );

      await waitFor(() => {
        expect(screen.getByText('User')).toBeOnTheScreen();
        expect(screen.getByText('Test User')).toBeOnTheScreen();
      });
    });

    test('removes invalid auth token, fetches a new one, and sets state + twitchApi.setAuthToken', async () => {
      SecureStore.getItemAsync.mockResolvedValueOnce(null);
      SecureStore.getItemAsync.mockResolvedValueOnce(
        JSON.stringify({
          accessToken: 'invalid_auth_access_token',
          expiresIn: 3600,
          tokenType: 'bearer',
        }),
      );

      twitchService.validateToken.mockResolvedValueOnce(false);
      twitchService.getDefaultToken.mockResolvedValueOnce({
        access_token: 'new_auth_access_token',
        expires_in: 3600,
        token_type: 'bearer',
      });

      render(
        <AuthContextProvider>
          <TestComponent />
        </AuthContextProvider>,
      );

      await waitFor(() => {
        // eslint-disable-next-line @typescript-eslint/unbound-method
        expect(twitchApi.setAuthToken).toHaveBeenCalledWith(
          'new_auth_access_token',
        );
        expect(screen.getByText('Anon')).toBeTruthy();
      });
    });
  });
});
