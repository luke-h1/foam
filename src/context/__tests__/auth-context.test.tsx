import { act } from 'react';
import type { ReactNode } from 'react';

import {
  render,
  renderHook,
  screen,
  waitFor,
} from '@testing-library/react-native';
import type { FetchRequestInit } from 'expo/build/winter/fetch/fetch.types';
import type { FetchResponse } from 'expo/build/winter/fetch/FetchResponse';
import { fetch } from 'expo/fetch';
import { type AuthSessionResult, TokenResponse } from 'expo-auth-session';
import * as ExpoSecureStore from 'expo-secure-store';
import { toast } from 'sonner-native';

import { Text } from '@app/components/ui/text/text';
import { queryClient } from '@app/lib/react-query/query-client';
import { setTwitchClientId, twitchApi } from '@app/services/api/clients';
import type { UserInfoResponse } from '@app/types/twitch/user';
import type { TwitchToken } from '@app/utils/authentication/token-lifecycle';

import { AuthContextProvider, useAuthContext } from '../auth-context';
import type { AuthState } from '../auth-context-value';
import { createTestUser } from './__fixtures__/auth-context.fixture';

const NOW = 1_700_000_000_000;
const HOUR_MS = 3600 * 1000;
const ENV_CLIENT_ID = 'test-client-id';
const TOKEN_URL = 'https://auth-proxy.test/token';
const REFRESH_URL = 'https://auth-proxy.test/refresh-token';
const VALIDATE_URL = 'https://id.twitch.tv/oauth2/validate';
const USERS_URL = 'https://api.twitch.tv/helix/users';

type RouteResult = FetchResponse | Promise<FetchResponse>;

interface FakeRequest {
  url: string;
  authorization: string | null;
  clientId: string | null;
}

interface FakeTwitch {
  anonToken: () => RouteResult;
  refreshToken: (refreshToken: string | null) => RouteResult;
  users: () => RouteResult;
  invalidTokens: Set<string>;
  tokenClientIds: Map<string, string>;
  requests: FakeRequest[];
}

function textResponse(
  body: string,
  status: number,
  contentType: string,
): FetchResponse {
  const response = {
    ok: status < 400,
    status,
    headers: {
      get: (name: string) =>
        name.toLowerCase() === 'content-type' ? contentType : null,
    },
    text: () => Promise.resolve(body),
  };

  // SAFETY: the auth flow and the API client only read ok, status, headers.get and text() off a response.
  return response as FetchResponse;
}

function json<TBody>(body: TBody, status = 200): FetchResponse {
  return textResponse(JSON.stringify(body), status, 'application/json');
}

function anonTokenResponse(accessToken: string): FetchResponse {
  return json({
    data: { access_token: accessToken, expires_in: 3600, token_type: 'bearer' },
  });
}

let twitch: FakeTwitch;

function readHeader(
  headers: FetchRequestInit['headers'],
  name: string,
): string | null {
  const entries = Object.entries(headers ?? {});
  const match = entries.find(([key]) => key.toLowerCase() === name);

  return match ? String(match[1]) : null;
}

function routeRequest(url: URL, authorization: string | null): RouteResult {
  const route = `${url.origin}${url.pathname}`;

  if (route === TOKEN_URL) {
    return twitch.anonToken();
  }

  if (route === REFRESH_URL) {
    return twitch.refreshToken(url.searchParams.get('token'));
  }

  if (route === VALIDATE_URL) {
    const token = authorization?.replace('Bearer ', '') ?? '';

    if (twitch.invalidTokens.has(token)) {
      return json({ status: 401, message: 'invalid access token' }, 401);
    }

    return json({
      client_id: twitch.tokenClientIds.get(token) ?? ENV_CLIENT_ID,
      expires_in: 3600,
    });
  }

  if (route === USERS_URL) {
    return twitch.users();
  }

  if (url.origin === 'https://api.twitch.tv') {
    return json({ data: [], pagination: {} });
  }

  return Promise.reject(new Error(`Unexpected request: ${url.toString()}`));
}

function fakeTwitchNetwork(user: UserInfoResponse) {
  twitch = {
    anonToken: () => anonTokenResponse('anon'),
    refreshToken: () => json({ data: null, error: 'no refresh' }, 400),
    users: () => json({ data: [user] }),
    invalidTokens: new Set(),
    tokenClientIds: new Map(),
    requests: [],
  };

  jest.mocked(fetch).mockImplementation((input, init) => {
    const url = new URL(String(input));
    const authorization = readHeader(init?.headers, 'authorization');

    twitch.requests.push({
      url: `${url.origin}${url.pathname}`,
      authorization,
      clientId: readHeader(init?.headers, 'client-id'),
    });

    return new Promise<FetchResponse>(resolve => {
      setTimeout(() => resolve(routeRequest(url, authorization)), 0);
    });
  });
}

function deferred<T>() {
  let resolve: (value: T) => void = () => {};

  const promise = new Promise<T>(next => {
    resolve = next;
  });

  return { promise, resolve };
}

async function readStoredToken(key: string): Promise<TwitchToken | null> {
  const raw = await ExpoSecureStore.getItemAsync(key);

  return raw === null ? null : JSON.parse(raw);
}

function storeToken(key: string, token: TwitchToken) {
  return ExpoSecureStore.setItemAsync(key, JSON.stringify(token));
}

function flushPending() {
  return act(() => new Promise<void>(resolve => setTimeout(resolve, 0)));
}

function wasRequested(url: string, authorization?: string) {
  return twitch.requests.some(
    request =>
      request.url === url &&
      (authorization === undefined || request.authorization === authorization),
  );
}

function magicLinkResponse(): AuthSessionResult {
  return {
    type: 'success',
    params: {},
    url: 'foam://auth?access_token=magic-user-token&token_type=bearer&expires_in=14400',
    errorCode: null,
    authentication: new TokenResponse({
      accessToken: 'magic-user-token',
      expiresIn: 14_400,
      tokenType: 'bearer',
    }),
  };
}

const magicUserAuthState: AuthState = {
  isAnonAuth: false,
  isLoggedIn: true,
  token: {
    accessToken: 'magic-user-token',
    expiresIn: 14_400,
    tokenType: 'bearer',
    expiresAt: NOW + 14_400 * 1000,
  },
};

const wrapper = ({ children }: { children: ReactNode }) => (
  <AuthContextProvider>{children}</AuthContextProvider>
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

describe('AuthContext', () => {
  const user = createTestUser({
    id: '123',
    login: 'test_user',
    display_name: 'Test User',
  });

  beforeEach(() => {
    jest.spyOn(Date, 'now').mockReturnValue(NOW);
    twitchApi.removeAuthToken();
    setTwitchClientId(ENV_CLIENT_ID);
    fakeTwitchNetwork(user);
  });

  afterEach(() => {
    jest.restoreAllMocks();
    queryClient.clear();
  });

  test('should populate auth state with anon token when no tokens are found', async () => {
    const { result } = renderHook(() => useAuthContext(), { wrapper });

    const anonToken: TwitchToken = {
      accessToken: 'anon',
      expiresIn: 3600,
      tokenType: 'bearer',
      expiresAt: NOW + HOUR_MS,
    };

    await waitFor(async () => {
      expect(result.current.authState).toEqual<AuthState>({
        isAnonAuth: true,
        isLoggedIn: false,
        token: anonToken,
      });

      expect(await readStoredToken('V1_foam-anon')).toEqual<TwitchToken>(
        anonToken,
      );
    });

    expect(result.current.ready).toBe(true);
    expect(result.current.user).toBeUndefined();
    expect(twitchApi.getAuthToken()).toBe('anon');
  });

  test('shows a friendly toast when the anon token request is blocked', async () => {
    twitch.anonToken = () =>
      textResponse('<html>blocked</html>', 403, 'text/html');

    renderHook(() => useAuthContext(), { wrapper });

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith('Access blocked', {
        description:
          'Your network blocked Foam from signing in. Try another network or turn off your VPN, then try again.',
      }),
    );
  });

  test('should login with twitch when oauth response is successful', async () => {
    const succesfulOauthResponse: AuthSessionResult = {
      type: 'success',
      params: {
        refresh_token: 'refresh-token',
      },
      url: 'foam://auth?access_token=user-token&refresh_token=refresh-token',
      errorCode: null,
      authentication: new TokenResponse({
        accessToken: 'user-token',
        expiresIn: 3600,
        tokenType: 'bearer',
      }),
    };

    const { result } = renderHook(() => useAuthContext(), { wrapper });

    await waitFor(async () =>
      expect(await readStoredToken('V1_foam-anon')).not.toBeNull(),
    );

    await act(async () => {
      await result.current.loginWithTwitch(succesfulOauthResponse);
    });

    const userToken: TwitchToken = {
      accessToken: 'user-token',
      expiresIn: 3600,
      tokenType: 'bearer',
      refreshToken: 'refresh-token',
      expiresAt: NOW + HOUR_MS,
    };

    expect(result.current.user).toEqual<UserInfoResponse>(user);

    expect(result.current.authState).toEqual<AuthState>({
      isAnonAuth: false,
      isLoggedIn: true,
      token: userToken,
    });

    expect(twitchApi.getAuthToken()).toBe('user-token');

    expect(await readStoredToken('V1_foam-user')).toEqual<TwitchToken>(
      userToken,
    );

    expect(await readStoredToken('V1_foam-anon')).toBeNull();
  });

  test('does not clobber a magic-link login when the anon token request resolves late', async () => {
    const anonResponse = deferred<FetchResponse>();
    twitch.anonToken = () => anonResponse.promise;

    const { result } = renderHook(() => useAuthContext(), { wrapper });

    await waitFor(() => expect(wasRequested(TOKEN_URL)).toBe(true));

    await act(async () => {
      await result.current.loginWithTwitch(magicLinkResponse());
    });

    expect(result.current.authState).toEqual<AuthState>(magicUserAuthState);

    await act(async () => {
      anonResponse.resolve(anonTokenResponse('anon'));
    });

    await waitFor(() =>
      expect(wasRequested(VALIDATE_URL, 'Bearer anon')).toBe(true),
    );

    await flushPending();

    expect(result.current.authState).toEqual<AuthState>(magicUserAuthState);
    expect(twitchApi.getAuthToken()).toBe('magic-user-token');
    expect(await readStoredToken('V1_foam-anon')).toBeNull();
  });

  test('does not clobber a magic-link login that completes before the anon bootstrap reaches the network', async () => {
    const storageGate = deferred<null>();

    jest
      .spyOn(ExpoSecureStore, 'getItemAsync')
      .mockReturnValue(storageGate.promise);

    const { result } = renderHook(() => useAuthContext(), { wrapper });

    await act(async () => {
      await result.current.loginWithTwitch(magicLinkResponse());
    });

    expect(result.current.authState).toEqual<AuthState>(magicUserAuthState);

    await act(async () => {
      storageGate.resolve(null);
    });

    await waitFor(() =>
      expect(wasRequested(VALIDATE_URL, 'Bearer anon')).toBe(true),
    );

    await flushPending();
    jest.mocked(ExpoSecureStore.getItemAsync).mockRestore();

    expect(result.current.authState).toEqual<AuthState>(magicUserAuthState);
    expect(twitchApi.getAuthToken()).toBe('magic-user-token');
    expect(await readStoredToken('V1_foam-anon')).toBeNull();
  });

  test('validates the magic-link token before getUserInfo so the Helix Client-Id is synced to the token client', async () => {
    jest
      .spyOn(ExpoSecureStore, 'getItemAsync')
      .mockReturnValue(new Promise<null>(() => {}));

    twitch.tokenClientIds.set('magic-user-token', 'magic-client-id');

    const { result } = renderHook(() => useAuthContext(), { wrapper });

    await act(async () => {
      await result.current.loginWithTwitch(magicLinkResponse());
    });

    const magicTokenRequests = twitch.requests.filter(
      request => request.authorization === 'Bearer magic-user-token',
    );

    expect(magicTokenRequests).toEqual<FakeRequest[]>([
      {
        url: VALIDATE_URL,
        authorization: 'Bearer magic-user-token',
        clientId: null,
      },
      {
        url: USERS_URL,
        authorization: 'Bearer magic-user-token',
        clientId: 'magic-client-id',
      },
    ]);

    expect(result.current.user).toEqual<UserInfoResponse>(user);
  });

  test('falls back to anon when getUserInfo fails after login, despite the live-session guard', async () => {
    twitch.anonToken = () => anonTokenResponse('anon-after-failed-login');

    const usersResponse = deferred<FetchResponse>();
    twitch.users = () => usersResponse.promise;

    const { result } = renderHook(() => useAuthContext(), { wrapper });

    await waitFor(() => expect(result.current.ready).toBe(true));

    let loginPromise: Promise<null | undefined> | undefined;

    await act(async () => {
      loginPromise = result.current.loginWithTwitch(magicLinkResponse());
      await Promise.resolve();
    });

    expect(result.current.authState?.isLoggedIn).toBe(true);

    await act(async () => {
      usersResponse.resolve(json({ message: 'unavailable' }, 503));
      await loginPromise;
    });

    const anonToken: TwitchToken = {
      accessToken: 'anon-after-failed-login',
      expiresIn: 3600,
      tokenType: 'bearer',
      expiresAt: NOW + HOUR_MS,
    };

    await waitFor(() =>
      expect(result.current.authState).toEqual<AuthState>({
        isAnonAuth: true,
        isLoggedIn: false,
        token: anonToken,
      }),
    );

    expect(twitchApi.getAuthToken()).toBe('anon-after-failed-login');
    expect(await readStoredToken('V1_foam-user')).toBeNull();
  });

  test('refreshes expired stored user token before falling back to anon auth', async () => {
    await storeToken('V1_foam-user', {
      accessToken: 'expired-user-token',
      expiresIn: 3600,
      tokenType: 'bearer',
      refreshToken: 'stored-refresh-token',
      expiresAt: NOW - 1000,
    });

    twitch.refreshToken = refreshToken =>
      refreshToken === 'stored-refresh-token'
        ? json({
            data: {
              access_token: 'refreshed-user-token',
              expires_in: 3600,
              token_type: 'bearer',
              refresh_token: 'rotated-refresh-token',
              scope: '',
            },
          })
        : json({ data: null, error: 'unknown refresh token' }, 400);

    render(
      <AuthContextProvider>
        <TestComponent />
      </AuthContextProvider>,
    );

    expect(await screen.findByText('Test User')).toBeOnTheScreen();
    expect(screen.getByText('User')).toBeOnTheScreen();
    expect(twitchApi.getAuthToken()).toBe('refreshed-user-token');

    expect(await readStoredToken('V1_foam-user')).toEqual<TwitchToken>({
      accessToken: 'refreshed-user-token',
      expiresIn: 3600,
      tokenType: 'bearer',
      refreshToken: 'rotated-refresh-token',
      expiresAt: NOW + HOUR_MS,
    });
  });

  test('keeps an expired user token without a refresh token when Twitch still validates it', async () => {
    const implicitToken: TwitchToken = {
      accessToken: 'implicit-user-token',
      expiresIn: 3600,
      tokenType: 'bearer',
      expiresAt: NOW - 1000,
    };

    await storeToken('V1_foam-user', implicitToken);

    render(
      <AuthContextProvider>
        <TestComponent />
      </AuthContextProvider>,
    );

    expect(await screen.findByText('Test User')).toBeOnTheScreen();
    expect(screen.getByText('User')).toBeOnTheScreen();

    // Implicit-grant token has no refresh token, so we never attempt a refresh
    // and never clear it solely because the local expiresAt has passed.
    expect(wasRequested(REFRESH_URL)).toBe(false);
    expect(twitchApi.getAuthToken()).toBe('implicit-user-token');

    expect(await readStoredToken('V1_foam-user')).toEqual<TwitchToken>(
      implicitToken,
    );
  });

  test('proactively refreshes near-expiry user token after startup', async () => {
    await storeToken('V1_foam-user', {
      accessToken: 'near-expiry-user-token',
      expiresIn: 3600,
      tokenType: 'bearer',
      refreshToken: 'stored-refresh-token',
      expiresAt: NOW + 3 * 60 * 1000,
    });

    twitch.refreshToken = () =>
      json({
        data: {
          access_token: 'background-refreshed-user-token',
          expires_in: 3600,
          token_type: 'bearer',
          refresh_token: 'background-refresh-token',
          scope: '',
        },
      });

    render(
      <AuthContextProvider>
        <TestComponent />
      </AuthContextProvider>,
    );

    expect(await screen.findByText('Test User')).toBeOnTheScreen();

    await waitFor(() =>
      expect(twitchApi.getAuthToken()).toBe('background-refreshed-user-token'),
    );

    expect(await readStoredToken('V1_foam-user')).toEqual<TwitchToken>({
      accessToken: 'background-refreshed-user-token',
      expiresIn: 3600,
      tokenType: 'bearer',
      refreshToken: 'background-refresh-token',
      expiresAt: NOW + HOUR_MS,
    });
  });

  describe('App startup', () => {
    test('checks if anon token is valid and sets the right state if valid', async () => {
      await ExpoSecureStore.setItemAsync(
        'V1_foam-anon',
        JSON.stringify({
          accessToken: 'anon_access_token',
          expiresIn: 3600,
          tokenType: 'bearer',
        }),
      );

      render(
        <AuthContextProvider>
          <TestComponent />
        </AuthContextProvider>,
      );

      expect(await screen.findByText('Anon')).toBeOnTheScreen();

      await waitFor(() =>
        expect(wasRequested(VALIDATE_URL, 'Bearer anon_access_token')).toBe(
          true,
        ),
      );

      await flushPending();

      expect(wasRequested(TOKEN_URL)).toBe(false);
      expect(twitchApi.getAuthToken()).toBe('anon_access_token');

      expect(await readStoredToken('V1_foam-anon')).toEqual<TwitchToken>({
        accessToken: 'anon_access_token',
        expiresIn: 3600,
        tokenType: 'bearer',
        expiresAt: NOW + HOUR_MS,
      });
    });

    test('handles invalid anon token', async () => {
      await storeToken('V1_foam-anon', {
        accessToken: 'invalid_anon_access_token',
        expiresIn: 3600,
        tokenType: 'bearer',
        expiresAt: NOW + HOUR_MS,
      });

      twitch.invalidTokens.add('invalid_anon_access_token');
      twitch.anonToken = () => anonTokenResponse('new_anon_access_token');

      render(
        <AuthContextProvider>
          <TestComponent />
        </AuthContextProvider>,
      );

      await waitFor(() =>
        expect(twitchApi.getAuthToken()).toBe('new_anon_access_token'),
      );

      expect(screen.getByText('Anon')).toBeOnTheScreen();

      expect(await readStoredToken('V1_foam-anon')).toEqual<TwitchToken>({
        accessToken: 'new_anon_access_token',
        expiresIn: 3600,
        tokenType: 'bearer',
        expiresAt: NOW + HOUR_MS,
      });
    });

    test('checks if auth token is valid and sets the right state if valid', async () => {
      const storedToken: TwitchToken = {
        accessToken: 'auth_access_token',
        expiresIn: 3600,
        tokenType: 'bearer',
        expiresAt: NOW + HOUR_MS,
      };

      await storeToken('V1_foam-user', storedToken);

      render(
        <AuthContextProvider>
          <TestComponent />
        </AuthContextProvider>,
      );

      expect(await screen.findByText('Test User')).toBeOnTheScreen();
      expect(screen.getByText('User')).toBeOnTheScreen();
      expect(twitchApi.getAuthToken()).toBe('auth_access_token');

      expect(await readStoredToken('V1_foam-user')).toEqual<TwitchToken>(
        storedToken,
      );
    });

    test('removes invalid auth token, fetches a new one, and sets state + twitchApi.setAuthToken', async () => {
      await storeToken('V1_foam-user', {
        accessToken: 'invalid_auth_access_token',
        expiresIn: 3600,
        tokenType: 'bearer',
        expiresAt: NOW + HOUR_MS,
      });

      twitch.invalidTokens.add('invalid_auth_access_token');
      twitch.anonToken = () => anonTokenResponse('new_auth_access_token');

      render(
        <AuthContextProvider>
          <TestComponent />
        </AuthContextProvider>,
      );

      await waitFor(() =>
        expect(twitchApi.getAuthToken()).toBe('new_auth_access_token'),
      );

      expect(screen.getByText('Anon')).toBeOnTheScreen();
      expect(await readStoredToken('V1_foam-user')).toBeNull();
    });
  });

  describe('logout', () => {
    test('drops the query cache instead of refetching it token-less', async () => {
      await storeToken('V1_foam-user', {
        accessToken: 'user-token',
        expiresIn: 3600,
        tokenType: 'bearer',
        expiresAt: NOW + HOUR_MS,
      });

      const { result } = renderHook(() => useAuthContext(), { wrapper });

      await waitFor(() =>
        expect(result.current.authState?.isLoggedIn).toBe(true),
      );

      queryClient.setQueryData(['followed-streams', 'user-only'], ['stream']);

      let logoutPromise: Promise<void> | undefined;

      act(() => {
        logoutPromise = result.current.logout();
      });

      await waitFor(() =>
        expect(result.current.authState?.isAnonAuth).toBe(true),
      );

      await act(() => logoutPromise);

      expect(
        queryClient
          .getQueryCache()
          .find({ queryKey: ['followed-streams', 'user-only'] }),
      ).toBeUndefined();

      expect(result.current.user).toBeUndefined();
      expect(twitchApi.getAuthToken()).toBe('anon');
      expect(await readStoredToken('V1_foam-user')).toBeNull();
    });
  });
});
