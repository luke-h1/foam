import { act } from 'react';
import type { FC, PropsWithChildren } from 'react';

import {
  render,
  renderHook,
  screen,
  waitFor,
} from '@testing-library/react-native';
import { type AuthSessionResult, TokenResponse } from 'expo-auth-session';

import { Text } from '@app/components/ui/Text/Text';
import { twitchApi as _twitchApi } from '@app/services/api/clients';
import {
  twitchService as _twitchService,
  type UserInfoResponse,
} from '@app/services/twitch-service';
import * as _SecureStore from '@app/utils/authentication/secureStore';

import {
  AuthContextProvider,
  type AuthContextProviderProps,
  type AuthContextState,
  useAuthContext,
} from '../AuthContext';

jest.mock('@app/services/twitch-service');
jest.mock('@app/services/api/clients');
jest.mock('@app/utils/authentication/secureStore');

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
    // clearAllMocks does not drain mockResolvedValueOnce queues or per-test
    // implementations, so a test whose call count shifts can consume a stale
    // value queued by an earlier test. Fully reset the auth mocks each test
    // (each test sets the behaviour it needs) so the suite is not call-count
    // fragile. Scoped to these mocks so the global setup-file mocks survive.
    SecureStore.getItemAsync.mockReset();
    SecureStore.setItemAsync.mockReset();
    SecureStore.deleteItemAsync.mockReset();
    twitchService.getDefaultToken.mockReset();
    twitchService.validateToken.mockReset();
    twitchService.getUserInfo.mockReset();
    twitchService.getRefreshToken.mockReset();
    twitchService.getTopStreams.mockResolvedValue({
      data: [],
    });
    twitchService.getTopCategories.mockResolvedValue({
      data: [],
    });
    twitchService.getFollowedStreams.mockResolvedValue([]);
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

  const TestComponent = () => {
    const { authState, user } = useAuthContext();
    return (
      <>
        <Text>{authState?.isAnonAuth ? 'Anon' : 'User'}</Text>
        <Text>{user ? user.display_name : 'No User'}</Text>
      </>
    );
  };

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
        token: result.current.authState?.token,
      });
      expect({
        accessToken: result.current.authState?.token?.accessToken,
        expiresAt: result.current.authState?.token?.expiresAt,
        expiresIn: result.current.authState?.token?.expiresIn,
        tokenType: result.current.authState?.token?.tokenType,
      }).toEqual({
        accessToken: 'anon',
        expiresAt: expect.any(Number),
        expiresIn: 3600,
        tokenType: 'bearer',
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
      params: {
        refresh_token: 'refresh-token',
      },
      url: 'foam://auth?access_token=user-token&refresh_token=refresh-token',
      errorCode: null,
      error: undefined,
      authentication: new TokenResponse({
        accessToken: 'user-token',
        expiresIn: 3600,
        tokenType: 'bearer',
      }),
    };
    twitchService.getUserInfo.mockResolvedValue(user);
    twitchService.getDefaultToken.mockResolvedValue({
      access_token: 'anon',
      expires_in: 3600,
      token_type: 'bearer',
    });
    SecureStore.getItemAsync.mockResolvedValue(null);

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
        token: result.current.authState?.token,
      });
      expect({
        accessToken: result.current.authState?.token?.accessToken,
        expiresAt: result.current.authState?.token?.expiresAt,
        expiresIn: result.current.authState?.token?.expiresIn,
        tokenType: result.current.authState?.token?.tokenType,
      }).toEqual({
        accessToken: 'user-token',
        expiresAt: expect.any(Number),
        expiresIn: 3600,
        tokenType: 'bearer',
      });

      // 1 for inital anon auth when app boots and the 2nd is for when the user logs in
      expect(SecureStore.setItemAsync).toHaveBeenCalledTimes(2);

      // Check that anon token was saved with expiresAt
      expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
        'V1_foam-anon',
        expect.stringMatching(
          /"accessToken":"anon","expiresIn":3600,"tokenType":"bearer","expiresAt":\d+/,
        ),
      );

      // Check that user token was saved with expiresAt
      expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
        'V1_foam-user',
        expect.stringMatching(
          /"accessToken":"user-token","expiresIn":3600,"tokenType":"bearer","refreshToken":"refresh-token","expiresAt":\d+/,
        ),
      );
    });
  });

  test('refreshes expired stored user token before falling back to anon auth', async () => {
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

    SecureStore.getItemAsync.mockResolvedValueOnce(null);
    SecureStore.getItemAsync.mockResolvedValueOnce(
      JSON.stringify({
        accessToken: 'expired-user-token',
        expiresIn: 3600,
        tokenType: 'bearer',
        refreshToken: 'stored-refresh-token',
        expiresAt: Date.now() - 1000,
      }),
    );
    twitchService.getRefreshToken.mockResolvedValueOnce({
      access_token: 'refreshed-user-token',
      expires_in: 3600,
      token_type: 'bearer',
      refresh_token: 'rotated-refresh-token',
      scope: '',
    });
    twitchService.validateToken.mockResolvedValueOnce(true);
    twitchService.getUserInfo.mockResolvedValueOnce(user);

    render(
      <AuthContextProvider>
        <TestComponent />
      </AuthContextProvider>,
    );

    await waitFor(() => {
      expect(twitchService.getRefreshToken).toHaveBeenCalledWith(
        'stored-refresh-token',
      );
      expect(twitchApi.setAuthToken.mock.calls).toContainEqual([
        'refreshed-user-token',
      ]);
      expect(screen.getByText('User')).toBeOnTheScreen();
      expect(screen.getByText('Test User')).toBeOnTheScreen();
      expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
        'V1_foam-user',
        expect.stringMatching(
          /"accessToken":"refreshed-user-token","expiresIn":3600,"tokenType":"bearer","refreshToken":"rotated-refresh-token","expiresAt":\d+/,
        ),
      );
    });
  });

  test('keeps an expired user token without a refresh token when Twitch still validates it', async () => {
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

    SecureStore.getItemAsync.mockResolvedValueOnce(null);
    SecureStore.getItemAsync.mockResolvedValueOnce(
      JSON.stringify({
        accessToken: 'implicit-user-token',
        expiresIn: 3600,
        tokenType: 'bearer',
        expiresAt: Date.now() - 1000,
      }),
    );
    twitchService.validateToken.mockResolvedValueOnce(true);
    twitchService.getUserInfo.mockResolvedValueOnce(user);

    render(
      <AuthContextProvider>
        <TestComponent />
      </AuthContextProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText('User')).toBeOnTheScreen();
      expect(screen.getByText('Test User')).toBeOnTheScreen();
    });

    // Implicit-grant token has no refresh token, so we never attempt a refresh
    // and never clear it solely because the local expiresAt has passed.
    expect(twitchService.getRefreshToken).not.toHaveBeenCalled();
    expect(twitchApi.setAuthToken).toHaveBeenCalledWith('implicit-user-token');
    expect(SecureStore.deleteItemAsync).not.toHaveBeenCalledWith(
      'V1_foam-user',
    );
  });

  test('proactively refreshes near-expiry user token after startup', async () => {
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

    SecureStore.getItemAsync.mockResolvedValueOnce(null);
    SecureStore.getItemAsync.mockResolvedValueOnce(
      JSON.stringify({
        accessToken: 'near-expiry-user-token',
        expiresIn: 3600,
        tokenType: 'bearer',
        refreshToken: 'stored-refresh-token',
        expiresAt: Date.now() + 3 * 60 * 1000,
      }),
    );
    twitchService.validateToken.mockResolvedValueOnce(true);
    twitchService.getUserInfo.mockResolvedValueOnce(user);
    twitchService.getRefreshToken.mockResolvedValueOnce({
      access_token: 'background-refreshed-user-token',
      expires_in: 3600,
      token_type: 'bearer',
      refresh_token: 'background-refresh-token',
      scope: '',
    });

    render(
      <AuthContextProvider>
        <TestComponent />
      </AuthContextProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText('User')).toBeOnTheScreen();
      expect(twitchService.getRefreshToken).toHaveBeenCalledWith(
        'stored-refresh-token',
      );
      expect(twitchApi.setAuthToken.mock.calls).toContainEqual([
        'background-refreshed-user-token',
      ]);
      expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
        'V1_foam-user',
        expect.stringMatching(
          /"accessToken":"background-refreshed-user-token","expiresIn":3600,"tokenType":"bearer","refreshToken":"background-refresh-token","expiresAt":\d+/,
        ),
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
        expect(screen.getByText('Anon')).toBeOnTheScreen();
      });
    });
  });
});
