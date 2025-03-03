/* eslint-disable consistent-return */
/* eslint-disable no-console */
/* eslint-disable camelcase */
import { twitchApi } from '@app/services/api';
import {
  DefaultTokenResponse,
  UserInfoResponse,
  twitchService,
} from '@app/services/twitchService';
import { AuthSessionResult, TokenResponse } from 'expo-auth-session';
import * as SecureStore from 'expo-secure-store';
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

export const storageKeys = {
  anon: 'foam-anon', // anon token
  user: 'foam-user', // logged in token
} as const;

export interface TwitchToken {
  accessToken: string;
  expiresIn: number;
  tokenType: string;
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

  const isExpiredToken = (token: TwitchToken) => {
    return new Date() >= new Date(token.expiresIn * 1000);
  };

  const fetchAnonToken = async () => {
    try {
      let result = await twitchService.getDefaultToken();

      if (process.env.NODE_ENV === 'test' && enableTestResult) {
        result = testResult || {
          access_token: '123',
          expires_in: 3600,
          token_type: 'bearer',
        };
      }

      setState({
        ready: true,
        authState: {
          isAnonAuth: true,
          isLoggedIn: false,
          token: {
            accessToken: result.access_token,
            expiresIn: result.expires_in,
            tokenType: result.token_type,
          },
        },
      });

      SecureStore.setItemAsync(
        storageKeys.anon,
        JSON.stringify({
          accessToken: result.access_token,
          expiresIn: result.expires_in,
          tokenType: result.token_type,
        }),
      );
      twitchApi.setAuthToken(result.access_token);
    } catch (e) {
      console.error('Failed to get anon auth', e);
      // eslint-disable-next-line no-useless-return
      return;
    }
  };

  const isExpiredUserToken = (token: TokenResponse) => {
    if (!token.expiresIn) {
      return false;
    }
    return new Date() >= new Date(token.expiresIn * 1000);
  };

  const doAuth = async (token: TokenResponse) => {
    if (!token.accessToken) {
      setUser(undefined);
      await doAnonAuth();
      return;
    }

    const isValidToken = !isExpiredUserToken(token);

    if (!isValidToken) {
      await doAnonAuth();
      return;
    }

    const shouldRefresh =
      new Date() >=
      new Date((token.expiresIn as number) * 1000 - 5 * 60 * 1000);

    if (shouldRefresh) {
      console.info('refreshing user token...');
      const newToken = await twitchService.getRefreshToken(token.accessToken);
      console.info('newUserToken', JSON.stringify(newToken, null, 2));

      setState({
        ready: true,
        authState: {
          isAnonAuth: false,
          isLoggedIn: true,
          token: {
            accessToken: newToken.access_token,
            expiresIn: newToken.expires_in,
            tokenType: newToken.token_type,
          },
        },
      });
      const u = await twitchService.getUserInfo(newToken.access_token);
      setUser(u);
      SecureStore.setItemAsync(
        storageKeys.user,
        JSON.stringify(newToken, null, 2),
      );
      twitchApi.setAuthToken(newToken.access_token);
    } else {
      setState({
        ready: true,
        authState: {
          isAnonAuth: false,
          isLoggedIn: true,
          token: {
            accessToken: token.accessToken,
            expiresIn: token.expiresIn as number,
            tokenType: token.tokenType,
          },
        },
      });
      const u = await twitchService.getUserInfo(token.accessToken);
      setUser(u);
      twitchApi.setAuthToken(token.accessToken);
    }
  };

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-expect-error
  const loginWithTwitch = async (response: AuthSessionResult | null) => {
    if (response?.type !== 'success' || !response.authentication) {
      await doAnonAuth();
      return null;
    }

    setState({
      ready: true,
      authState: {
        isAnonAuth: false,
        isLoggedIn: true,
        token: {
          accessToken: response.authentication.accessToken,
          expiresIn: response.authentication.expiresIn as number,
          tokenType: response.authentication.tokenType,
        },
      },
    });
    const u = await twitchService.getUserInfo(
      response.authentication.accessToken,
    );
    setUser(u);

    SecureStore.deleteItemAsync(storageKeys.anon);

    const stringifedAuth = JSON.stringify(response.authentication);

    SecureStore.setItemAsync(storageKeys.user, stringifedAuth);

    twitchApi.setAuthToken(response.authentication.accessToken);
  };

  const doAnonAuth = async (token?: TwitchToken) => {
    if (!token?.accessToken) {
      await fetchAnonToken();
    } else {
      const isValidToken = !isExpiredToken(token);

      if (!isValidToken) {
        twitchApi.removeAuthToken();
        await fetchAnonToken();
      } else {
        const shouldRefresh =
          new Date() >= new Date(token.expiresIn * 1000 - 5 * 60 * 1000);

        if (shouldRefresh) {
          console.info('refreshing anon token...');
          const newToken = await twitchService.getRefreshToken(
            token.accessToken,
          );
          console.info('new anon token', JSON.stringify(newToken, null, 2));

          setState({
            ready: true,
            authState: {
              isAnonAuth: true,
              isLoggedIn: false,
              token: {
                accessToken: newToken.access_token,
                expiresIn: newToken.expires_in,
                tokenType: newToken.token_type,
              },
            },
          });
          SecureStore.setItemAsync(
            storageKeys.anon,
            JSON.stringify(newToken, null, 2),
          );
          twitchApi.setAuthToken(newToken.access_token);
        } else {
          setState({
            ready: true,
            authState: {
              isAnonAuth: true,
              isLoggedIn: false,
              token: {
                accessToken: token.accessToken,
                expiresIn: token.expiresIn,
                tokenType: token.tokenType,
              },
            },
          });
          twitchApi.setAuthToken(token.accessToken);
        }
      }
    }
  };

  const populateAuthState = async () => {
    const [storedAnonToken, storedAuthToken] = await Promise.all([
      SecureStore.getItemAsync(storageKeys.anon),
      SecureStore.getItemAsync(storageKeys.user),
    ]);

    if (storedAuthToken) {
      const parsedAuthToken = JSON.parse(storedAuthToken) as TokenResponse;
      await doAuth(parsedAuthToken);
    } else if (storedAnonToken) {
      const parsedAnonToken = JSON.parse(storedAnonToken) as TwitchToken;
      await doAnonAuth(parsedAnonToken);
    } else {
      await doAnonAuth();
    }
  };

  useEffect(() => {
    populateAuthState();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const contextState: AuthContextState = useMemo(() => {
    return {
      authState: state.authState,
      loginWithTwitch,
      populateAuthState,
      logout: async () => {
        await SecureStore.deleteItemAsync(storageKeys.user);
        await SecureStore.deleteItemAsync(storageKeys.anon);
        setState({ ready: true });
        setUser(undefined);
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
  const context = useContext(AuthContext);

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
