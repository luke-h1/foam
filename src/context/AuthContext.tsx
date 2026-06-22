import {
  followedStreamsQueryOptions,
  topCategoriesInfiniteQueryOptions,
  topStreamsInfiniteQueryOptions,
} from '@app/lib/react-query/queries/twitch';
import { twitchApi } from '@app/services/api/clients';
import {
  DefaultTokenResponse,
  UserInfoResponse,
  twitchService,
} from '@app/services/twitch-service';
import { parseTwitchAuthTokenFromResponse } from '@app/utils/authentication/twitchAuth';
import { logger } from '@app/utils/logger';
import { queryClient } from '@app/lib/react-query/query-client';
import { AuthSessionResult, TokenResponse } from 'expo-auth-session';
import * as SecureStore from '@app/utils/authentication/secureStore';
import {
  createContext,
  ReactNode,
  use,
  useEffect,
  useState,
  useRef,
} from 'react';
import { toast } from 'sonner-native';
import { AppState, InteractionManager } from 'react-native';
import { useSyncRef } from '@app/hooks/useSyncRef';
import i18next from '@app/i18n/i18next';

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

/**
 * Buffer time in seconds before token expiration to consider it expired
 * This allows proactive refresh before actual expiration
 */
const TOKEN_EXPIRATION_BUFFER = 60; // 1 minute buffer
const AUTH_STARTUP_TIMEOUT_MS = 12_000;
const USER_TOKEN_REFRESH_BUFFER_MS = 5 * 60 * 1000;
const USER_TOKEN_REFRESH_POLL_INTERVAL_MS = 60_000;

/**
 * Check if a token is expired or will expire soon
 * Uses expires_in from the Twitch API response to calculate expiration
 * @param token - The token to check
 * @returns true if token is expired or will expire within the buffer time
 */
const isTokenExpired = (token: TwitchToken): boolean => {
  const { expiresAt } = token;

  if (!expiresAt) {
    // If no expiration timestamp, we can't determine expiration - assume valid but log warning
    logger.auth.warn(
      'Token missing expiresAt timestamp, cannot verify expiration',
    );
    return false;
  }

  const now = Date.now();
  const bufferTime = TOKEN_EXPIRATION_BUFFER * 1000; // Convert to milliseconds

  return now >= expiresAt - bufferTime;
};

/**
 * Calculate expiration timestamp from expiresIn and add it to a token
 */
const addExpirationTimestamp = (
  token: Omit<TwitchToken, 'expiresAt'>,
): TwitchToken => {
  const now = Date.now();
  return {
    ...token,
    expiresAt: now + token.expiresIn * 1000, // expiresIn is in seconds, convert to milliseconds
  };
};

const isTwitchToken = (
  token: TokenResponse | TwitchToken,
): token is TwitchToken => {
  return 'expiresAt' in token;
};

export interface TwitchToken {
  accessToken: string;
  expiresIn: number;
  tokenType: string;
  refreshToken?: string;
  expiresAt?: number; // Unix timestamp in milliseconds when token expires
}

const shouldProactivelyRefreshUserToken = (
  token: TwitchToken,
  now = Date.now(),
) => {
  if (!token.refreshToken || !token.expiresAt) {
    return false;
  }

  return now >= token.expiresAt - USER_TOKEN_REFRESH_BUFFER_MS;
};

const normaliseTwitchToken = (
  token: TokenResponse | TwitchToken,
): TwitchToken | null => {
  if (isTwitchToken(token)) {
    return token;
  }

  if (token.expiresIn === undefined) {
    logger.auth.warn('Token missing expiresIn, cannot proceed with auth');
    return null;
  }

  const maybeStoredToken = token as Partial<TwitchToken>;
  return addExpirationTimestamp({
    accessToken: token.accessToken,
    expiresIn: token.expiresIn,
    tokenType: token.tokenType,
    refreshToken: maybeStoredToken.refreshToken,
  });
};

interface AuthState {
  isLoggedIn: boolean;
  isAnonAuth: boolean;
  token: TwitchToken;
}

const getFallbackAnonToken = (): TwitchToken => ({
  accessToken: '',
  expiresIn: 3600,
  tokenType: 'bearer',
  expiresAt: Date.now() + 60 * 60 * 1000,
});

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

async function refreshStoredUserToken(
  token: TwitchToken,
  reason: string,
): Promise<TwitchToken | null> {
  if (!token.refreshToken) {
    logger.auth.info('User token cannot be refreshed without refresh token', {
      reason,
    });
    return null;
  }

  try {
    const refreshed = await twitchService.getRefreshToken(token.refreshToken);
    const refreshedToken = addExpirationTimestamp({
      accessToken: refreshed.access_token,
      expiresIn: refreshed.expires_in,
      tokenType: refreshed.token_type,
      refreshToken: refreshed.refresh_token || token.refreshToken,
    });

    logger.auth.info('Refreshed stored user token', {
      reason,
      expiresIn: refreshedToken.expiresIn,
    });

    return refreshedToken;
  } catch (error) {
    logger.auth.warn('Failed to refresh stored user token', {
      reason,
      error,
    });
    return null;
  }
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

export const AuthContextProvider = ({
  children,
  enableTestResult,
  testResult,
}: AuthContextProviderProps) => {
  const [state, setState] = useState<State>({
    ready: false,
  });

  const [user, setUser] = useState<UserInfoResponse | undefined>(undefined);
  const hasTimedOut = useRef(false);
  const userTokenRefreshInFlightRef = useRef(false);
  const authStateRef = useRef(state.authState);
  authStateRef.current = state.authState;

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

  const fetchAnonToken = async (overrideTestResult?: DefaultTokenResponse) => {
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
      const u = await twitchService.getUserInfo(token.accessToken);
      // Set token before setUser so any enabled queries (e.g. followed streams) use the correct token
      twitchApi.setAuthToken(token.accessToken);
      setUser(u);

      queueInitialDataPrefetch(u.id);

      await SecureStore.deleteItemAsync(storageKeys.anon);

      await SecureStore.setItemAsync(storageKeys.user, JSON.stringify(token));
    } catch (error) {
      logger.auth.error('Failed to get user info after login', error);
      await doAnonAuth();
    }

    return null;
  };

  const doAnonAuth = async (token?: TwitchToken) => {
    if (!token?.accessToken) {
      // request a default token and set it in state
      await fetchAnonToken();
      return;
    }

    // Check if token is expired based on timestamp (faster than API call)
    if (isTokenExpired(token)) {
      logger.auth.info('Anonymous token is expired, fetching new token');
      twitchApi.removeAuthToken();
      await fetchAnonToken();
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

    queueInitialDataPrefetch();

    const validatedAnonAccessToken = token.accessToken;
    void twitchService
      .validateToken(token.accessToken)
      .then(isValidToken => {
        if (isValidToken) {
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
