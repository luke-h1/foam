import { twitchQueries } from '@app/queries/twitchQueries';
import { twitchApi } from '@app/services/api';
import {
  DefaultTokenResponse,
  UserInfoResponse,
  twitchService,
} from '@app/services/twitch-service';
import { logger } from '@app/utils/logger';
import { queryClient } from '@app/utils/react-query/reacy-query';
import { AuthSessionResult, TokenResponse } from 'expo-auth-session';
import * as SecureStore from 'expo-secure-store';
import {
  createContext,
  ReactNode,
  use,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { toast } from 'sonner-native';

/**
 * Prefetch initial data for faster startup
 */
const prefetchInitialData = (userId?: string) => {
  if (userId) {
    const followedQuery = twitchQueries.getFollowedStreams(userId);
    void queryClient.prefetchQuery(followedQuery);
  }
  void queryClient.prefetchQuery({
    ...twitchQueries.getTopStreams(),
    queryKey: twitchQueries.getTopStreams().queryKey,
    queryFn: () => twitchQueries.getTopStreams().queryFn({}),
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
  expiresAt?: number; // Unix timestamp in milliseconds when token expires
}

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

  const fetchAnonToken = async () => {
    try {
      let result = await twitchService.getDefaultToken();

      // hack to get around tests getting hung up on micro queue
      if (process.env.NODE_ENV === 'test' && enableTestResult) {
        result = testResult || {
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

      prefetchInitialData();
    } catch (e) {
      logger.auth.error('Failed to get anon auth', e);
      // eslint-disable-next-line no-useless-return
      return;
    }
  };

  const doAuth = async (token: TokenResponse | TwitchToken) => {
    // Convert TokenResponse to TwitchToken format if needed
    let twitchToken: TwitchToken;

    if (isTwitchToken(token)) {
      twitchToken = token;
    } else {
      // TokenResponse has expiresIn as number | undefined, but we know it should be a number
      // from expo-auth-session when authentication succeeds
      if (token.expiresIn === undefined) {
        logger.auth.warn('Token missing expiresIn, cannot proceed with auth');
        await doAnonAuth();
        return;
      }
      twitchToken = addExpirationTimestamp({
        accessToken: token.accessToken,
        expiresIn: token.expiresIn,
        tokenType: token.tokenType,
      });
    }

    // Check if token is expired before making API calls
    if (isTokenExpired(twitchToken)) {
      logger.auth.info(
        'Stored user token is expired, clearing and falling back to anon auth',
      );
      await SecureStore.deleteItemAsync(storageKeys.anon);
      await SecureStore.deleteItemAsync(storageKeys.user);
      await doAnonAuth();
      return;
    }

    try {
      const isValidToken = await twitchService.validateToken(
        twitchToken.accessToken,
      );

      if (!isValidToken) {
        // token isn't valid, do anon auth
        logger.auth.warn('User token validation failed, clearing tokens');
        await SecureStore.deleteItemAsync(storageKeys.anon);
        await SecureStore.deleteItemAsync(storageKeys.user);
        await doAnonAuth();
        return;
      }
    } catch (error) {
      logger.auth.warn('validateToken failed. Clearing tokens', error);
      await SecureStore.deleteItemAsync(storageKeys.anon);
      await SecureStore.deleteItemAsync(storageKeys.user);
      await doAnonAuth();
      return;
    }

    try {
      const u = await twitchService.getUserInfo(twitchToken.accessToken);
      twitchApi.setAuthToken(twitchToken.accessToken);
      setUser(u);

      // Prefetch initial data immediately after auth
      prefetchInitialData(u.id);

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

    if (!response.authentication) {
      await doAnonAuth();
      console.info('auth failed');
      return null;
    }

    const token = addExpirationTimestamp({
      accessToken: response.authentication.accessToken,
      expiresIn: response.authentication.expiresIn as number,
      tokenType: response.authentication.tokenType,
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

      prefetchInitialData(u.id);

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

    // Validate token with API to ensure it's still valid
    try {
      const isValidToken = await twitchService.validateToken(token.accessToken);

      if (!isValidToken) {
        logger.auth.warn(
          'Anonymous token validation failed, fetching new token',
        );
        twitchApi.removeAuthToken();
        await fetchAnonToken();
        return;
      }

      // Token is valid and not expired
      // Ensure token has expiration timestamp (for backward compatibility with old stored tokens)
      const tokenWithExpiration = token.expiresAt
        ? token
        : addExpirationTimestamp({
            accessToken: token.accessToken,
            expiresIn: token.expiresIn,
            tokenType: token.tokenType,
          });

      // Update stored token with expiration timestamp if it was missing
      if (!token.expiresAt) {
        await SecureStore.setItemAsync(
          storageKeys.anon,
          JSON.stringify(tokenWithExpiration),
        );
      }

      setState({
        ready: true,
        authState: {
          isAnonAuth: true,
          isLoggedIn: false,
          token: tokenWithExpiration,
        },
      });
      twitchApi.setAuthToken(token.accessToken);

      // Prefetch top streams for anonymous users with cached token
      prefetchInitialData();
    } catch (error) {
      logger.auth.error('Token validation error, fetching new token', error);
      twitchApi.removeAuthToken();
      await fetchAnonToken();
    }
  };

  const populateAuthState = async () => {
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
  };

  useEffect(() => {
    void (async () => {
      await populateAuthState();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const contextState: AuthContextState = useMemo(() => {
    return {
      authState: state.authState,
      loginWithTwitch,
      populateAuthState,
      logout: async () => {
        await Promise.all([
          SecureStore.deleteItemAsync(storageKeys.user),
          SecureStore.deleteItemAsync(storageKeys.anon),
        ]);
        setState({ ready: true });
        setUser(undefined);
        twitchApi.removeAuthToken();
        await queryClient.invalidateQueries();
        await queryClient.resetQueries();
        await doAnonAuth();
      },
      fetchAnonToken,
      user,
      ready: state.ready,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.authState, user]);

  return state.ready ? (
    <AuthContext.Provider value={contextState}>{children}</AuthContext.Provider>
  ) : null;
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
  return (
    <AuthContext.Provider
      // eslint-disable-next-line react/jsx-no-constructed-context-values
      value={{
        ...rest,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
