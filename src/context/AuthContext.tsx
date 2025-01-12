/* eslint-disable no-console */
/* eslint-disable camelcase */
import { twitchApi } from '@app/services/api';
import twitchService, {
  DefaultTokenResponse,
  UserInfoResponse,
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

export interface AuthState {
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

  /**
   * TODO @luke-h1 - fetch the following when authenticated and store in state:
   *   authStatus?: AuthStatus; type AuthStatus = "uninitialized" | "success" | "error";

        globalUserState?: GlobalUserStateTags;
        blockedUsers: string[];
   * 
   */

  const isValidToken = async (token: string) => {
    return twitchService.validateToken(token);
  };

  const isExpiredToken = (token: TwitchToken) => {
    /* 
    If the current date and time is before the token's expiration date and time, return true, indicating that the token is still valid. Otherwise, it returns false, indicating that the token has expired.
    we pre-empt this in order to not call the Twitch API with an invalid token
    */
    return (
      new Date() < new Date(token.expiresIn * 1000) ||
      isValidToken(token.accessToken)
    );
  };

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

  const isExpiredUserToken = async (token: TokenResponse) => {
    if (!token.expiresIn) {
      return false;
    }

    return new Date() < new Date(token.expiresIn * 1000);
  };

  const doAuth = async (token: TokenResponse) => {
    if (!token || !state.authState?.token) {
      // evict cached anon details
      SecureStore.deleteItemAsync(storageKeys.user);
      setUser(undefined);
      doAnonAuth();
    }
    // we have a token, check it's validity
    // eslint-disable-next-line no-shadow
    const isValidToken = isExpiredUserToken(token);

    if (!isValidToken) {
      // token isn't valid, do anon auth
      SecureStore.deleteItemAsync(storageKeys.anon);
      doAnonAuth();
    }

    // we can assume it's valid at this point and we have it in state, let's check if it expires soon
    const shouldRefresh =
      new Date() >=
      new Date(
        // @ts-expect-error expiresIn can potentially be undefined
        token.expiresIn * 1000 - 5 * 60 * 1000,
      ); // 5 minutes before expiry

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
            ...state.authState?.token,
            accessToken: newToken.access_token,
            expiresIn: newToken.expires_in,
            tokenType: newToken.token_type,
          },
        },
      });
      const u = await twitchService.getUserInfo(newToken.access_token);
      setUser(u);
      SecureStore.setItemAsync(
        storageKeys.anon,
        JSON.stringify(newToken, null, 2),
      );
    }

    // token is valid, return early
    // eslint-disable-next-line no-useless-return
    return;
  };

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  // eslint-disable-next-line consistent-return
  const loginWithTwitch = async (response: AuthSessionResult | null) => {
    if (response?.type !== 'success') {
      doAnonAuth();
      console.info('response.type !== success');
      return null;
    }

    if (!response.authentication) {
      // auth failed for some reason, gracefully aquire an anon token
      doAnonAuth();
      console.info('auth failed');
      return null;
    }

    console.log('tokenType ->', response.authentication.tokenType);
    console.log('expiresIn ->', response.authentication.expiresIn);
    console.log('accecssToken ->', response.authentication.accessToken);

    // we have succeeded
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

    // evict cached anon details
    SecureStore.deleteItemAsync(storageKeys.anon);

    const stringifedAuth = JSON.stringify(response.authentication);

    // set tokens in secure-store
    SecureStore.setItemAsync(storageKeys.user, stringifedAuth);

    // set header in axios
    twitchApi.setAuthToken(response.authentication.accessToken);
    // eslint-disable-next-line consistent-return
  };

  const doAnonAuth = async (token?: TwitchToken) => {
    if (!token?.accessToken) {
      // request a default token and set it in state
      await fetchAnonToken();
    } else {
      // we have an anonymous token, check it's validity
      const isValidToken = isExpiredToken(token);

      console.log('isValidToken ->', isValidToken);

      // if it's expired, get a new token and set it in state
      if (!isValidToken) {
        twitchApi.removeAuthToken();
        fetchAnonToken();
      } else {
        // we can assume it's valid at this point and we have it in state, let's check if it expires soon
        const shouldRefresh =
          new Date() >=
          new Date(
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            state!.authState!.token.expiresIn * 1000 - 5 * 60 * 1000,
          ); // 5 minutes before expiry

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
                ...state.authState?.token,
                accessToken: newToken.access_token,
                expiresIn: newToken.expires_in,
                tokenType: newToken.token_type,
              },
            },
          });
          const u = await twitchService.getUserInfo(newToken.access_token);
          setUser(u);
          SecureStore.setItemAsync(
            storageKeys.anon,
            JSON.stringify(newToken, null, 2),
          );
          twitchApi.setAuthToken(state.authState?.token.accessToken as string);
        }

        // token is valid, return early
        // eslint-disable-next-line no-useless-return
        return;
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
      doAuth(parsedAuthToken);
    }

    if (storedAnonToken) {
      const parsedAnonToken = JSON.parse(storedAnonToken) as TwitchToken;
      doAnonAuth(parsedAnonToken);
    }

    // we don't have an anonymous token or a logged in token. log the user in anonymously
    doAnonAuth();
  };

  useEffect(() => {
    populateAuthState();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // useEffect(() => {
  //   const checkTokenValidity = async () => {
  //     const token = state?.authState?.token?.accessToken;
  //     if (!token) return;

  //     const shouldRefreshToken =
  //       state.authState?.isAnonAuth && state.authState.token.expiresIn
  //         ? new Date() >=
  //           new Date(state.authState.token.expiresIn * 1000 - 5 * 60 * 1000) // 5 minutes before expiry
  //         : !(await twitchService.validateToken(token));

  //     if (shouldRefreshToken) {
  //       const newToken = await twitchService.getRefreshToken(token);

  //       setState(prev => ({
  //         ...prev,
  //         authState: {
  //           isAnonAuth: true,
  //           isLoggedIn: false,
  //           token: {
  //             accessToken: newToken.access_token,
  //             expiresIn: newToken.expires_in as number,
  //             tokenType: 'bearer',
  //           },
  //         },
  //       }));
  //       // setState(prev => ({
  //       //   ...prev,
  //       //   authState: {
  //       //     ...prev.authState,
  //       //     token: newToken,
  //       //   },
  //       // }));
  //     }
  //   };

  //   const intervalId = setInterval(checkTokenValidity, 60 * 1000); // Check every minute

  //   return () => clearInterval(intervalId);
  // }, [state.authState]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const contextState: AuthContextState = useMemo(() => {
    return {
      authState: state.authState,
      loginWithTwitch,
      populateAuthState,
      logout: () => Promise.resolve(),
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
