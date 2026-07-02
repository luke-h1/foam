import {
  createContext,
  ReactNode,
  use,
  useEffect,
  useRef,
  useState,
} from 'react';
import { AppState, InteractionManager } from 'react-native';

import { AuthSessionResult, TokenResponse } from 'expo-auth-session';
import { toast } from 'sonner-native';

import { useSyncRef } from '@app/hooks/useSyncRef';
import i18next from '@app/i18n/i18next';
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
import * as SecureStore from '@app/utils/authentication/secureStore';
import {
  addExpirationTimestamp,
  getFallbackAnonToken,
  isTokenExpired,
  normaliseTwitchToken,
  refreshStoredUserToken,
  shouldProactivelyRefreshUserToken,
  type TwitchToken,
} from '@app/utils/authentication/tokenLifecycle';
import { parseTwitchAuthTokenFromResponse } from '@app/utils/authentication/twitchAuth';
import { logger } from '@app/utils/logger';

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

export const storageKeys = {
  anon: 'V1_foam-anon', // anon token
  user: 'V1_foam-user', // logged in token
} as const;

const AUTH_STARTUP_TIMEOUT_MS = 12_000;
const USER_TOKEN_REFRESH_POLL_INTERVAL_MS = 60_000;

interface AuthState {
  isLoggedIn: boolean;
  isAnonAuth: boolean;
  token: TwitchToken;
}

export interface AuthContextState {
  user?: UserInfoResponse;
  authState?: AuthState;
  loginWithTwitch: (
    response: AuthSessionResult | null,
  ) => Promise<null | undefined>;
  populateAuthState: () => Promise<void>;
  logout: () => Promise<void>;

  // for unit tests only
  fetchAnonToken: (testResult?: DefaultTokenResponse) => Promise<void>;

  ready: boolean;
}

interface State {
  authState?: AuthState;
  ready: boolean;
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

export const AuthContext = createContext<AuthContextState | undefined>(
  undefined,
);

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

  const markAuthStateReadyFallback = (reason: string, error?: unknown) => {
    if (state.ready || hasTimedOut.current) {
      return;
    }

    let didApplyFallback = false;

    setState(prev => {
      if (prev.ready) {
        return prev;
      }

      didApplyFallback = true;
      return {
        ...prev,
        ready: true,
        authState: prev.authState ?? {
          isAnonAuth: true,
          isLoggedIn: false,
          token: getFallbackAnonToken(),
        },
      };
    });

    if (!didApplyFallback) {
      return;
    }

    if (hasTimedOut.current) {
      return;
    }

    hasTimedOut.current = true;
    logger.auth.warn('Auth startup fallback triggered', {
      reason,
      errorType: error instanceof Error ? error.name : typeof error,
    });

    logger.auth.error(`Auth context did not initialize in time: ${reason}`, {
      name: 'auth_error',
      error,
      category: 'Auth',
      action: 'startup_timeout',
      reason,
      errorType: error instanceof Error ? error.name : typeof error,
    });
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
      markAuthStateReadyFallback('fetchAnonToken failed', e);
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

      if (refreshedToken) {
        twitchToken = refreshedToken;
      } else {
        logger.auth.info(
          'Stored user token appears expired and cannot be refreshed; validating with Twitch before clearing',
        );
      }
    }

    const refreshOrFallBackToAnon = async (reason: string, error?: unknown) => {
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

      if (!isValidToken) {
        if (!(await refreshOrFallBackToAnon('validation_failed'))) {
          return;
        }
      }
    } catch (error) {
      if (!(await refreshOrFallBackToAnon('validation_error', error))) {
        return;
      }
    }

    try {
      const u = await twitchService.getUserInfo(twitchToken.accessToken);
      twitchApi.setAuthToken(twitchToken.accessToken);
      setUser(u);

      // Prefetch initial data after first interactions
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
      toast.error(i18next.t('auth:couldNotAuthenticate'));
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
      toast.error(i18next.t('auth:couldNotAuthenticate'));
      await doAnonAuth();
      return null;
    }

    const token = addExpirationTimestamp({
      accessToken: parsedToken.accessToken,
      expiresIn: parsedToken.expiresIn,
      tokenType: parsedToken.tokenType,
      refreshToken: parsedToken.refreshToken,
    });

    // we have succeeded
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
      // request a default token and set it in state
      await fetchAnonToken(undefined, options);
      return;
    }

    // Check if token is expired based on timestamp (faster than API call)
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
        const currentAuthState = authStateRef.current;
        if (
          !currentAuthState ||
          currentAuthState.isLoggedIn ||
          !currentAuthState.isAnonAuth ||
          currentAuthState.token.accessToken !== validatedAnonAccessToken
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
          // Try to parse as TwitchToken first (new format with issuedAt)
          const parsedAuthToken = JSON.parse(storedAuthToken) as
            TwitchToken | TokenResponse;
          await doAuth(parsedAuthToken);
        } catch (error) {
          logger.auth.error('Failed to parse stored user token', error);
          await SecureStore.deleteItemAsync(storageKeys.user);
          await doAnonAuth();
        }
      } else if (storedAnonToken) {
        try {
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
      markAuthStateReadyFallback('populateAuthState failed', error);
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

    const appStateSubscription = AppState.addEventListener(
      'change',
      nextAppState => {
        if (nextAppState === 'active') {
          refreshIfNeeded('app_active');
        }
      },
    );

    return () => {
      clearInterval(refreshInterval);
      appStateSubscription.remove();
    };
  }, [refreshCurrentUserTokenRef, state.authState]);

  const contextState: AuthContextState = {
    authState: state.authState,
    loginWithTwitch: (...args) => loginWithTwitchRef.current(...args),
    populateAuthState: () => populateAuthStateRef.current(),
    logout: async () => {
      await Promise.all([
        SecureStore.deleteItemAsync(storageKeys.user),
        SecureStore.deleteItemAsync(storageKeys.anon),
      ]);
      setState({ ready: true });
      setUser(undefined);
      twitchApi.removeAuthToken();
      await Promise.all([
        queryClient.invalidateQueries(),
        queryClient.resetQueries(),
        doAnonAuthRef.current(),
      ]);
    },
    fetchAnonToken: testResult => fetchAnonTokenRef.current(testResult),
    user,
    ready: state.ready,
  };

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
