import {
  ReactNode,
  use,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { InteractionManager } from 'react-native';

import { AuthSessionResult, TokenResponse } from 'expo-auth-session';
import { toast } from 'sonner-native';

import { useSyncRef } from '@app/hooks/use-sync-ref';
import {
  followedStreamsQueryOptions,
  topCategoriesInfiniteQueryOptions,
  topStreamsInfiniteQueryOptions,
} from '@app/lib/react-query/queries/twitch';
import { queryClient } from '@app/lib/react-query/query-client';
import { twitchApi } from '@app/services/api/clients';
import { twitchService } from '@app/services/twitch-service';
import type { DefaultTokenResponse } from '@app/types/twitch/auth';
import type { UserInfoResponse } from '@app/types/twitch/user';
import { subscribeToAppStateTransitions } from '@app/utils/app-state/app-state-transitions';
import * as SecureStore from '@app/utils/authentication/secure-store';
import {
  addExpirationTimestamp,
  getFallbackAnonToken,
  isTokenExpired,
  normaliseTwitchToken,
  refreshStoredUserToken,
  shouldProactivelyRefreshUserToken,
  type TwitchToken,
} from '@app/utils/authentication/token-lifecycle';
import { parseTwitchAuthTokenFromResponse } from '@app/utils/authentication/twitch-auth';
import { logger } from '@app/utils/logger';

import {
  AuthContext,
  type AuthContextState,
  type AuthState,
} from './auth-context-value';

/**
 * Prefetch initial data for faster startup
 */
const prefetchInitialData = (userId?: string) => {
  if (userId) {
    void queryClient.prefetchQuery(followedStreamsQueryOptions(userId));
  }

  void queryClient.prefetchInfiniteQuery(topStreamsInfiniteQueryOptions());
  void queryClient.prefetchInfiniteQuery(topCategoriesInfiniteQueryOptions());
};

const queueInitialDataPrefetch = (userId?: string) => {
  InteractionManager.runAfterInteractions(() => {
    prefetchInitialData(userId);
  });
};

const storageKeys = {
  anon: 'V1_foam-anon', // anon token
  user: 'V1_foam-user', // logged in token
} as const;

const AUTH_STARTUP_TIMEOUT_MS = 12_000;
const USER_TOKEN_REFRESH_POLL_INTERVAL_MS = 60_000;

interface State {
  authState?: AuthState;
  ready: boolean;
}

/**
 * A stored token past its expiry that will not refresh still gets validated
 * with Twitch before it is cleared, so record why that path was taken.
 */
function logIfUnrefreshed(refreshedToken: TwitchToken | null): void {
  if (refreshedToken) {
    return;
  }

  logger.auth.info(
    'Stored user token appears expired and cannot be refreshed; validating with Twitch before clearing',
  );
}

/**
 * Records that auth never finished starting up and the anonymous fallback took
 * over. Logged twice on purpose: a warning for the timeline, an error so it
 * reaches Sentry.
 */
/**
 * True when the anon token that was validated is still the one in play.
 */
function isStillLiveAnonToken(
  authState: AuthState | undefined,
  accessToken: string,
): boolean {
  return Boolean(
    authState &&
    !authState.isLoggedIn &&
    authState.isAnonAuth &&
    authState.token.accessToken === accessToken,
  );
}

function logAuthStartupFallback(reason: string, error?: Error): void {
  const errorType = error?.name ?? 'undefined';

  logger.auth.warn('Auth startup fallback triggered', { reason, errorType });

  logger.auth.error(`Auth context did not initialize in time: ${reason}`, {
    name: 'auth_error',
    error,
    category: 'Auth',
    action: 'startup_timeout',
    reason,
    errorType,
  });
}

/**
 * A caught value here is only ever logged, so a non-Error throw becomes an
 * Error carrying its text. This is the parse step the fallback helpers rely
 * on, which is why they take `Error` rather than `unknown`.
 */
// oxlint-disable-next-line anti-slop/no-unknown-parameters -- a catch variable is unknown by language rule; this is the parser for it
function asError(caught: unknown): Error {
  return caught instanceof Error ? caught : new Error(String(caught));
}

function applyRefreshedUserToken(
  previous: State,
  currentAccessToken: string,
  refreshedToken: TwitchToken,
): State {
  if (
    !previous.authState?.isLoggedIn ||
    previous.authState.isAnonAuth ||
    previous.authState.token.accessToken !== currentAccessToken
  ) {
    return previous;
  }

  return {
    ready: true,
    authState: {
      ...previous.authState,
      token: refreshedToken,
    },
  };
}

async function refreshCurrentUserTokenForState(
  currentAuthState: AuthState,
  setState: React.Dispatch<React.SetStateAction<State>>,
  inFlightRef: React.MutableRefObject<boolean>,
  reason: string,
): Promise<boolean> {
  if (inFlightRef.current) {
    return false;
  }

  inFlightRef.current = true;
  const currentAccessToken = currentAuthState.token.accessToken;

  try {
    const refreshedToken = await refreshStoredUserToken(
      currentAuthState.token,
      reason,
    );

    if (!refreshedToken) {
      return false;
    }

    twitchApi.setAuthToken(refreshedToken.accessToken);

    await SecureStore.setItemAsync(
      storageKeys.user,
      JSON.stringify(refreshedToken),
    );

    setState(previous =>
      applyRefreshedUserToken(previous, currentAccessToken, refreshedToken),
    );

    return true;
  } finally {
    inFlightRef.current = false;
  }
}

export type AuthContextProviderProps = {
  children: ReactNode;
  enableTestResult?: boolean;
  testResult?: DefaultTokenResponse;
};

function useAuthContextValue({
  enableTestResult,
  testResult,
}: Omit<AuthContextProviderProps, 'children'>): AuthContextState {
  const [state, setState] = useState<State>({
    ready: false,
  });

  const [user, setUser] = useState<UserInfoResponse | undefined>(undefined);
  const hasTimedOut = useRef(false);
  const userTokenRefreshInFlightRef = useRef(false);
  const authStateRef = useSyncRef(state.authState);

  const markAuthStateReadyFallback = (reason: string, error?: Error) => {
    if (state.ready || hasTimedOut.current) {
      return;
    }

    // Claim the fallback before the state write, so a second call in the same
    // tick cannot log it twice. The updater keeps its own guard for the state.
    hasTimedOut.current = true;

    setState(prev =>
      prev.ready
        ? prev
        : {
            ...prev,
            ready: true,
            authState: prev.authState ?? {
              isAnonAuth: true,
              isLoggedIn: false,
              token: getFallbackAnonToken(),
            },
          },
    );

    logAuthStartupFallback(reason, error);
  };

  const fetchAnonToken = async (
    overrideTestResult?: DefaultTokenResponse,
    options?: { force?: boolean },
  ) => {
    try {
      let result = await twitchService.getDefaultToken();

      // hack to get around tests getting hung up on micro queue
      if (process.env.NODE_ENV === 'test' && enableTestResult) {
        result = overrideTestResult ??
          testResult ?? {
            access_token: '123',
            expires_in: 3600,
            token_type: 'bearer',
          };
      }

      if (!options?.force && authStateRef.current?.isLoggedIn) {
        return;
      }

      const token = addExpirationTimestamp({
        accessToken: result.access_token,
        expiresIn: result.expires_in,
        tokenType: result.token_type,
      });

      setState({
        ready: true,
        authState: {
          isAnonAuth: true,
          isLoggedIn: false,
          token,
        },
      });

      await SecureStore.setItemAsync(storageKeys.anon, JSON.stringify(token));
      twitchApi.setAuthToken(result.access_token);

      queueInitialDataPrefetch();
    } catch (e) {
      logger.auth.error('Failed to get anon auth', e);
      markAuthStateReadyFallback('fetchAnonToken failed', asError(e));
    }
  };

  const refreshCurrentUserToken = (reason: string) => {
    const currentAuthState = state.authState;

    if (!currentAuthState?.isLoggedIn || currentAuthState.isAnonAuth) {
      return Promise.resolve(false);
    }

    return refreshCurrentUserTokenForState(
      currentAuthState,
      setState,
      userTokenRefreshInFlightRef,
      reason,
    );
  };

  const doAuth = async (token: TokenResponse | TwitchToken) => {
    let twitchToken = normaliseTwitchToken(token);

    if (!twitchToken) {
      await doAnonAuth();
      return;
    }

    // Implicit-grant tokens have no refresh token and Twitch omits expires_in,
    // so our local expiresAt can be a bogus 1-hour window even though the token
    // is valid for weeks. Don't clear on that alone — try a refresh, and when
    // none is available fall through to Twitch's validate endpoint below as the
    // source of truth.
    if (isTokenExpired(twitchToken)) {
      const refreshedToken = await refreshStoredUserToken(
        twitchToken,
        'expired',
      );

      logIfUnrefreshed(refreshedToken);
      twitchToken = refreshedToken ?? twitchToken;
    }

    const refreshOrFallBackToAnon = async (reason: string, error?: Error) => {
      if (!twitchToken) {
        await doAnonAuth();
        return false;
      }

      const refreshedToken = await refreshStoredUserToken(twitchToken, reason);

      if (refreshedToken) {
        twitchToken = refreshedToken;
        return true;
      }

      logger.auth.warn('User token refresh unavailable, falling back to anon', {
        reason,
        error,
      });

      await SecureStore.deleteItemAsync(storageKeys.user);
      await doAnonAuth();
      return false;
    };

    try {
      const isValidToken = await twitchService.validateToken(
        twitchToken.accessToken,
      );

      const recovered =
        isValidToken || (await refreshOrFallBackToAnon('validation_failed'));

      if (!recovered) {
        return;
      }
    } catch (error) {
      if (
        !(await refreshOrFallBackToAnon('validation_error', asError(error)))
      ) {
        return;
      }
    }

    try {
      const u = await twitchService.getUserInfo(twitchToken.accessToken);
      twitchApi.setAuthToken(twitchToken.accessToken);
      setUser(u);

      queueInitialDataPrefetch(u.id);

      await SecureStore.setItemAsync(
        storageKeys.user,
        JSON.stringify(twitchToken),
      );

      setState({
        ready: true,
        authState: {
          isAnonAuth: false,
          isLoggedIn: true,
          token: twitchToken,
        },
      });
    } catch (error) {
      logger.auth.error(
        'Failed to get user info, falling back to anon auth',
        error,
      );

      await SecureStore.deleteItemAsync(storageKeys.user);
      await doAnonAuth();
    }
  };

  const loginWithTwitch = async (response: AuthSessionResult | null) => {
    if (!response || response?.type !== 'success') {
      toast.error("Couldn't authenticate with twitch");
      await doAnonAuth();
      return null;
    }

    const parsedToken = parseTwitchAuthTokenFromResponse(response);

    if (!parsedToken) {
      logger.auth.warn('Auth response succeeded but did not contain a token', {
        responseType: response.type,
        hasAuthentication: !!response.authentication,
        responseUrl: response.url,
      });

      toast.error("Couldn't authenticate with twitch");
      await doAnonAuth();
      return null;
    }

    const token = addExpirationTimestamp({
      accessToken: parsedToken.accessToken,
      expiresIn: parsedToken.expiresIn,
      tokenType: parsedToken.tokenType,
      refreshToken: parsedToken.refreshToken,
    });

    setState({
      ready: true,
      authState: {
        isAnonAuth: false,
        isLoggedIn: true,
        token,
      },
    });

    try {
      // Magic-link / proxy-issued tokens are minted under a different Twitch
      // client id than EXPO_PUBLIC_TWITCH_CLIENT_ID. Helix rejects /users when
      // the Client-Id header doesn't match the token's client, so validate first
      // (it syncs the header to the token's client id) before getUserInfo, the
      // same order doAuth uses on restart.
      await twitchService.validateToken(token.accessToken);

      const u = await twitchService.getUserInfo(token.accessToken);

      // Set token before setUser so any enabled queries (e.g. followed streams) use the correct token
      twitchApi.setAuthToken(token.accessToken);

      setUser(u);

      queueInitialDataPrefetch(u.id);

      await SecureStore.deleteItemAsync(storageKeys.anon);

      await SecureStore.setItemAsync(storageKeys.user, JSON.stringify(token));
    } catch (error) {
      logger.auth.error('Failed to get user info after login', error);
      await doAnonAuth(undefined, { force: true });
    }

    return null;
  };

  const doAnonAuth = async (
    token?: TwitchToken,
    options?: { force?: boolean },
  ) => {
    if (!token?.accessToken) {
      await fetchAnonToken(undefined, options);
      return;
    }

    if (isTokenExpired(token)) {
      logger.auth.info('Anonymous token is expired, fetching new token');
      twitchApi.removeAuthToken();
      await fetchAnonToken(undefined, options);
      return;
    }

    if (!options?.force && authStateRef.current?.isLoggedIn) {
      return;
    }

    const tokenWithExpiration = token.expiresAt
      ? token
      : addExpirationTimestamp({
          accessToken: token.accessToken,
          expiresIn: token.expiresIn,
          tokenType: token.tokenType,
        });

    twitchApi.setAuthToken(token.accessToken);

    setState({
      ready: true,
      authState: {
        isAnonAuth: true,
        isLoggedIn: false,
        token: tokenWithExpiration,
      },
    });

    if (!token.expiresAt) {
      void SecureStore.setItemAsync(
        storageKeys.anon,
        JSON.stringify(tokenWithExpiration),
      ).catch(error => {
        logger.auth.warn('Failed to persist anon token expiry', error);
      });
    }

    const validatedAnonAccessToken = token.accessToken;

    void twitchService
      .validateToken(token.accessToken)
      .then(isValidToken => {
        if (isValidToken) {
          queueInitialDataPrefetch();
          return;
        }

        // Only refetch when this exact anon token is still the live one; a
        // sign-in or a newer anon token landing first makes it stale news.
        if (
          !isStillLiveAnonToken(authStateRef.current, validatedAnonAccessToken)
        ) {
          return;
        }

        logger.auth.warn(
          'Anonymous token validation failed, fetching new token',
        );

        twitchApi.removeAuthToken();
        void fetchAnonToken();
      })
      .catch(error => {
        logger.auth.warn('Anonymous token background validation error', error);
        queueInitialDataPrefetch();
      });
  };

  const populateAuthState = async () => {
    try {
      const [storedAnonToken, storedAuthToken] = await Promise.all([
        SecureStore.getItemAsync(storageKeys.anon),
        SecureStore.getItemAsync(storageKeys.user),
      ]);

      if (storedAuthToken) {
        try {
          // SAFETY: this key only ever holds a token this app wrote, in one of
          // the two shapes below. doAuth() normalises them, and a parse failure
          // or a wrong shape falls through to the catch and re-authenticates.
          const parsedAuthToken = JSON.parse(storedAuthToken) as
            | TwitchToken
            | TokenResponse;
          await doAuth(parsedAuthToken);
        } catch (error) {
          logger.auth.error('Failed to parse stored user token', error);
          await SecureStore.deleteItemAsync(storageKeys.user);
          await doAnonAuth();
        }
      } else if (storedAnonToken) {
        try {
          // SAFETY: this key only ever holds an anon token this app wrote. A
          // parse failure or a wrong shape falls through to the catch and
          // fetches a fresh one.
          const parsedAnonToken = JSON.parse(storedAnonToken) as TwitchToken;
          await doAnonAuth(parsedAnonToken);
        } catch (error) {
          logger.auth.error('Failed to parse stored anon token', error);
          await SecureStore.deleteItemAsync(storageKeys.anon);
          await doAnonAuth();
        }
      } else {
        await doAnonAuth();
      }
    } catch (error) {
      logger.auth.error(
        'Auth bootstrap failed during initial state load',
        error,
      );
      markAuthStateReadyFallback('populateAuthState failed', asError(error));
    }
  };

  const markAuthStateReadyFallbackRef = useSyncRef(markAuthStateReadyFallback);
  const populateAuthStateRef = useSyncRef(populateAuthState);
  const refreshCurrentUserTokenRef = useSyncRef(refreshCurrentUserToken);
  const loginWithTwitchRef = useSyncRef(loginWithTwitch);
  const fetchAnonTokenRef = useSyncRef(fetchAnonToken);
  const doAnonAuthRef = useSyncRef(doAnonAuth);

  useEffect(() => {
    const startupTimeout = setTimeout(() => {
      markAuthStateReadyFallbackRef.current('startup timeout');
    }, AUTH_STARTUP_TIMEOUT_MS);

    void populateAuthStateRef.current().catch(error => {
      markAuthStateReadyFallbackRef.current(
        'populateAuthState rejected',
        error,
      );
    });

    return () => {
      clearTimeout(startupTimeout);
    };
  }, [markAuthStateReadyFallbackRef, populateAuthStateRef]);

  useEffect(() => {
    const refreshIfNeeded = (reason: string) => {
      const currentAuthState = state.authState;

      if (
        !currentAuthState?.isLoggedIn ||
        currentAuthState.isAnonAuth ||
        !shouldProactivelyRefreshUserToken(currentAuthState.token)
      ) {
        return;
      }

      void refreshCurrentUserTokenRef.current(reason);
    };

    refreshIfNeeded('token_state_changed');

    const refreshInterval = setInterval(() => {
      refreshIfNeeded('scheduled');
    }, USER_TOKEN_REFRESH_POLL_INTERVAL_MS);

    const unsubscribeAppState = subscribeToAppStateTransitions(
      ({ current }) => {
        if (current === 'active') {
          refreshIfNeeded('app_active');
        }
      },
    );

    return () => {
      clearInterval(refreshInterval);
      unsubscribeAppState();
    };
  }, [refreshCurrentUserTokenRef, state.authState]);

  // The ref-backed callbacks are identity-stable so the context value only
  // changes when auth state actually changes — this provider wraps the whole
  // app and self-updates on a refresh poll and app foreground, so an
  // unmemoized value re-renders every consumer on each of those ticks.
  const loginWithTwitchCallback = useCallback(
    (...args: Parameters<AuthContextState['loginWithTwitch']>) =>
      loginWithTwitchRef.current(...args),
    [loginWithTwitchRef],
  );

  const populateAuthStateCallback = useCallback(
    () => populateAuthStateRef.current(),
    [populateAuthStateRef],
  );

  const fetchAnonTokenCallback = useCallback(
    (testResult?: DefaultTokenResponse) =>
      fetchAnonTokenRef.current(testResult),
    [fetchAnonTokenRef],
  );

  const logout = useCallback(async () => {
    await Promise.all([
      SecureStore.deleteItemAsync(storageKeys.user),
      SecureStore.deleteItemAsync(storageKeys.anon),
    ]);

    setState({ ready: true });
    setUser(undefined);
    twitchApi.removeAuthToken();
    await queryClient.cancelQueries();
    queryClient.removeQueries();
    await doAnonAuthRef.current();
  }, [doAnonAuthRef]);

  const contextState: AuthContextState = useMemo(
    () => ({
      authState: state.authState,
      loginWithTwitch: loginWithTwitchCallback,
      populateAuthState: populateAuthStateCallback,
      logout,
      fetchAnonToken: fetchAnonTokenCallback,
      user,
      ready: state.ready,
    }),
    [
      state.authState,
      state.ready,
      user,
      loginWithTwitchCallback,
      populateAuthStateCallback,
      logout,
      fetchAnonTokenCallback,
    ],
  );

  return contextState;
}

export const AuthContextProvider = ({
  children,
  enableTestResult,
  testResult,
}: AuthContextProviderProps) => {
  const contextState = useAuthContextValue({ enableTestResult, testResult });

  return (
    <AuthContext.Provider value={contextState}>{children}</AuthContext.Provider>
  );
};

export type { AuthContextState } from './auth-context-value';
export { AuthContext } from './auth-context-value';

export function useAuthContext() {
  const context = use(AuthContext);

  if (!context) {
    throw new Error(
      'useAuthContext must be used within an AuthContextProvider',
    );
  }

  return context;
}

interface AuthContextTestProviderProps extends AuthContextState {
  fetchAnonToken: (testResult?: DefaultTokenResponse) => Promise<void>;
  children: ReactNode;
}

export function AuthContextTestProvider({
  children,
  ...rest
}: AuthContextTestProviderProps) {
  const value: AuthContextState = { ...rest };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
