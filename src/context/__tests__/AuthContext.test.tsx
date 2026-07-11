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
import { twitchService as _twitchService } from '@app/services/twitch-service';
import type { DefaultTokenResponse } from '@app/types/twitch/auth';
import type { UserInfoResponse } from '@app/types/twitch/user';
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
        token: {
          accessToken: 'anon',
          expiresIn: 3600,
          tokenType: 'bearer',
          expiresAt: expect.any(Number),
        },
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
        token: {
          accessToken: 'user-token',
          expiresIn: 3600,
          tokenType: 'bearer',
          refreshToken: 'refresh-token',
          expiresAt: expect.any(Number),
        },
      });

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

  test('does not clobber a magic-link login when the anon token request resolves late', async () => {
    const user: UserInfoResponse = {
      id: '123',
      login: 'magic_user',
      display_name: 'Magic User',
      type: '',
      broadcaster_type: '',
      description: '',
      profile_image_url: '',
      offline_image_url: '',
      view_count: 0,
      created_at: '',
    };

    let resolveAnon: ((value: DefaultTokenResponse) => void) | undefined;
    twitchService.getDefaultToken.mockImplementationOnce(
      () =>
        new Promise<DefaultTokenResponse>(resolve => {
          resolveAnon = resolve;
        }),
    );
    SecureStore.getItemAsync.mockResolvedValue(null);
    twitchService.getUserInfo.mockResolvedValue(user);

    const magicResponse: AuthSessionResult = {
      type: 'success',
      params: {},
      url: 'foam://auth?access_token=magic-user-token&token_type=bearer&expires_in=14400',
      errorCode: null,
      error: undefined,
      authentication: new TokenResponse({
        accessToken: 'magic-user-token',
        expiresIn: 14400,
        tokenType: 'bearer',
      }),
    };

    const { result } = renderHook(() => useAuthContext(), {
      wrapper,
      initialProps,
    });

    await waitFor(() =>
      expect(twitchService.getDefaultToken).toHaveBeenCalledTimes(1),
    );

    await act(async () => {
      await result.current.loginWithTwitch(magicResponse);
    });

    expect(result.current.authState?.isLoggedIn).toBe(true);

    await act(async () => {
      resolveAnon?.({
        access_token: 'anon',
        expires_in: 3600,
        token_type: 'bearer',
      });
      await Promise.resolve();
    });

    await waitFor(() => {
      expect(result.current.authState).toEqual({
        isAnonAuth: false,
        isLoggedIn: true,
        token: result.current.authState?.token,
      });
      expect(result.current.authState?.token?.accessToken).toBe(
        'magic-user-token',
      );
    });
  });

  test('does not clobber a magic-link login that completes before the anon bootstrap reaches the network', async () => {
    const user: UserInfoResponse = {
      id: '123',
      login: 'magic_user',
      display_name: 'Magic User',
      type: '',
      broadcaster_type: '',
      description: '',
      profile_image_url: '',
      offline_image_url: '',
      view_count: 0,
      created_at: '',
    };

    let resolveStorage: ((value: null) => void) | undefined;
    const storageGate = new Promise<null>(resolve => {
      resolveStorage = resolve;
    });
    SecureStore.getItemAsync.mockReturnValue(storageGate);
    twitchService.getDefaultToken.mockResolvedValue({
      access_token: 'anon',
      expires_in: 3600,
      token_type: 'bearer',
    });
    twitchService.getUserInfo.mockResolvedValue(user);

    const magicResponse: AuthSessionResult = {
      type: 'success',
      params: {},
      url: 'foam://auth?access_token=magic-user-token&token_type=bearer&expires_in=14400',
      errorCode: null,
      error: undefined,
      authentication: new TokenResponse({
        accessToken: 'magic-user-token',
        expiresIn: 14400,
        tokenType: 'bearer',
      }),
    };

    const { result } = renderHook(() => useAuthContext(), {
      wrapper,
      initialProps,
    });

    await act(async () => {
      await result.current.loginWithTwitch(magicResponse);
    });

    expect(result.current.authState?.isLoggedIn).toBe(true);

    await act(async () => {
      resolveStorage?.(null);
      await Promise.resolve();
      await Promise.resolve();
    });

    await waitFor(() => {
      expect(result.current.authState).toEqual({
        isAnonAuth: false,
        isLoggedIn: true,
        token: result.current.authState?.token,
      });
      expect(result.current.authState?.token?.accessToken).toBe(
        'magic-user-token',
      );
    });
  });

  test('validates the magic-link token before getUserInfo so the Helix Client-Id is synced to the token client', async () => {
    const user: UserInfoResponse = {
      id: '123',
      login: 'magic_user',
      display_name: 'Magic User',
      type: '',
      broadcaster_type: '',
      description: '',
      profile_image_url: '',
      offline_image_url: '',
      view_count: 0,
      created_at: '',
    };

    let resolveStorage: ((value: null) => void) | undefined;
    const storageGate = new Promise<null>(resolve => {
      resolveStorage = resolve;
    });
    SecureStore.getItemAsync.mockReturnValue(storageGate);
    twitchService.getDefaultToken.mockResolvedValue({
      access_token: 'anon',
      expires_in: 3600,
      token_type: 'bearer',
    });

    // Assert the ordering by outcome: getUserInfo must only run once
    // validateToken has resolved (and thus synced the Helix Client-Id). Record
    // whether validate had completed at the moment /users was called.
    let validateResolved = false;
    let validateWasResolvedWhenUserInfoCalled: boolean | undefined;
    twitchService.validateToken.mockImplementation(async () => {
      validateResolved = true;
      return true;
    });
    twitchService.getUserInfo.mockImplementation(async () => {
      validateWasResolvedWhenUserInfoCalled = validateResolved;
      return user;
    });

    const magicResponse: AuthSessionResult = {
      type: 'success',
      params: {},
      url: 'foam://auth?access_token=magic-user-token&token_type=bearer&expires_in=14400',
      errorCode: null,
      error: undefined,
      authentication: new TokenResponse({
        accessToken: 'magic-user-token',
        expiresIn: 14400,
        tokenType: 'bearer',
      }),
    };

    const { result } = renderHook(() => useAuthContext(), {
      wrapper,
      initialProps,
    });

    await act(async () => {
      await result.current.loginWithTwitch(magicResponse);
    });

    await act(async () => {
      resolveStorage?.(null);
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(result.current.authState?.isLoggedIn).toBe(true);
    expect(twitchService.validateToken).toHaveBeenCalledWith(
      'magic-user-token',
    );
    expect(twitchService.getUserInfo).toHaveBeenCalledWith('magic-user-token');
    // Client-Id must be synced (validate) before the /users call (getUserInfo).
    expect(validateWasResolvedWhenUserInfoCalled).toBe(true);
  });

  test('falls back to anon when getUserInfo fails after login, despite the live-session guard', async () => {
    SecureStore.getItemAsync.mockResolvedValue(null);
    twitchService.getDefaultToken.mockResolvedValue({
      access_token: 'anon-after-failed-login',
      expires_in: 3600,
      token_type: 'bearer',
    });

    let rejectUserInfo: ((reason: Error) => void) | undefined;
    twitchService.getUserInfo.mockImplementationOnce(
      () =>
        new Promise<UserInfoResponse>((_, reject) => {
          rejectUserInfo = reject;
        }),
    );

    const magicResponse: AuthSessionResult = {
      type: 'success',
      params: {},
      url: 'foam://auth?access_token=magic-user-token&token_type=bearer&expires_in=14400',
      errorCode: null,
      error: undefined,
      authentication: new TokenResponse({
        accessToken: 'magic-user-token',
        expiresIn: 14400,
        tokenType: 'bearer',
      }),
    };

    const { result } = renderHook(() => useAuthContext(), {
      wrapper,
      initialProps,
    });

    await waitFor(() => expect(result.current.ready).toBe(true));

    let loginPromise: Promise<null | undefined> | undefined;
    await act(async () => {
      loginPromise = result.current.loginWithTwitch(magicResponse);
      await Promise.resolve();
    });

    expect(result.current.authState?.isLoggedIn).toBe(true);

    await act(async () => {
      rejectUserInfo?.(new Error('user info unavailable'));
      await loginPromise;
    });

    await waitFor(() => {
      expect(result.current.authState?.isAnonAuth).toBe(true);
      expect(result.current.authState?.isLoggedIn).toBe(false);
      expect(result.current.authState?.token?.accessToken).toBe(
        'anon-after-failed-login',
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
