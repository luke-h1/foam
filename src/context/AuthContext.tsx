import { twitchApi } from '@app/services/api';
import {
  DefaultTokenResponse,
  UserInfoResponse,
  twitchService,
} from '@app/services/twitch-service';
import { logger } from '@app/utils/logger';
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

export const storageKeys = {
  anon: 'V1_foam-anon', // anon token
  user: 'V1_foam-user', // logged in token
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

      await SecureStore.setItemAsync(
        storageKeys.anon,
        JSON.stringify({
          accessToken: result.access_token,
          expiresIn: result.expires_in,
          tokenType: result.token_type,
        }),
      );
      twitchApi.setAuthToken(result.access_token);
    } catch (e) {
      logger.auth.error('Failed to get anon auth', e);
      // eslint-disable-next-line no-useless-return
      return;
    }
  };

  const doAuth = async (token: TokenResponse) => {
    try {
      const isValidToken = await twitchService.validateToken(token.accessToken);

      if (!isValidToken) {
        // token isn't valid, do anon auth
        await SecureStore.deleteItemAsync(storageKeys.anon);
        await SecureStore.deleteItemAsync(storageKeys.user);
        await doAnonAuth();

        return;
      }
    } catch (error) {
      logger.auth.warn('validateToken failed. Clearing tokens', error);
      await SecureStore.deleteItemAsync(storageKeys.anon);
      await SecureStore.deleteItemAsync(storageKeys.user);
    }

    const u = await twitchService.getUserInfo(token.accessToken);
    setUser(u);
    twitchApi.setAuthToken(token.accessToken);
    await SecureStore.setItemAsync(
      storageKeys.user,
      JSON.stringify({
        accessToken: token.accessToken,
        expiresIn: token.expiresIn,
        tokenType: token.tokenType,
      }),
    );
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
  };

  const loginWithTwitch = async (response: AuthSessionResult | null) => {
    if (response?.type !== 'success') {
      toast.error("Couldn't authenticate with twitch");
      await doAnonAuth();
      return null;
    }

    if (!response.authentication) {
      await doAnonAuth();
      console.info('auth failed');
      return null;
    }

    // console.log('tokenType ->', response.authentication.tokenType);
    // console.log('expiresIn ->', response.authentication.expiresIn);
    // console.log('accecssToken ->', response.authentication.accessToken);

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
    await SecureStore.deleteItemAsync(storageKeys.anon);

    const stringifedAuth = JSON.stringify(response.authentication);

    // set tokens in secure-store
    await SecureStore.setItemAsync(storageKeys.user, stringifedAuth);

    // set header in axios
    twitchApi.setAuthToken(response.authentication.accessToken);
    return null;
  };

  const doAnonAuth = async (token?: TwitchToken) => {
    if (!token?.accessToken) {
      // request a default token and set it in state
      await fetchAnonToken();
    } else {
      // we have an anonymous token, check its validity
      const isValidToken = await twitchService.validateToken(token.accessToken);

      console.log('isValidToken ->', isValidToken);

      // if it's expired, get a new token and set it in state
      if (!isValidToken) {
        twitchApi.removeAuthToken();
        await fetchAnonToken();
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
