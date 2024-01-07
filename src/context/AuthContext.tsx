import { AuthSessionResult, TokenResponse } from 'expo-auth-session';
import * as SecureStore from 'expo-secure-store';
import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { twitchApi } from '../services/Client';
import twitchService, { UserInfoResponse } from '../services/twitchService';
import logger from '../utils/logger';

export const StorageKeys = {
  anonToken: 'foam-anonToken',
  authToken: 'foam-authToken',
} as const;

type StorageKey = keyof typeof StorageKeys;

interface AuthContextState {
  auth?: Auth;
  user?: UserInfoResponse;
  login: (response: AuthSessionResult | null) => Promise<null | undefined>;
  logout: () => Promise<void>;
  getToken: (key: StorageKey) => Promise<string | null>;
  ready: boolean;
}

export const AuthContext = createContext<AuthContextState | undefined>(
  undefined,
);

interface Props {
  children?: ReactNode;
}

interface Auth {
  token?: TokenResponse;
  anonToken?: string;
  isAnonAuth?: boolean;
  isAuth?: boolean;
}

interface State {
  auth?: Auth;
  ready: boolean;
}

export const AuthContextProvider = ({ children }: Props) => {
  const [state, setState] = useState<State>({
    ready: false,
  });
  const [user, setUser] = useState<UserInfoResponse | undefined>();
  const [authToken, setAuthToken] = useState<TokenResponse | undefined>();
  const [anonToken, setAnonToken] = useState<string | undefined>();

  const isValidToken = async (token: string | null) => {
    if (!token) {
      return false;
    }
    return twitchService.validateToken(token);
  };

  useEffect(() => {
    const getTokens = async () => {
      // eslint-disable-next-line no-shadow
      const [anonToken, authToken] = await Promise.all([
        await SecureStore.getItemAsync(StorageKeys.anonToken),
        await SecureStore.getItemAsync(StorageKeys.authToken),
      ]);

      // user is not logged in
      // and they are authenticated anonymously with Twitch
      if (!authToken && !isValidToken(authToken) && anonToken) {
        setAnonToken(JSON.stringify(anonToken));
        setState({
          ready: true,
          auth: {
            anonToken,
            isAnonAuth: true,
            isAuth: false,
          },
        });

        twitchApi.defaults.headers.common.Authorization = `Bearer ${anonToken}`;
      }

      // User is authenticated with Twitch
      if (authToken && (await isValidToken(authToken))) {
        setAuthToken(authToken as unknown as TokenResponse);
        setState({
          ready: true,
          auth: {
            token: authToken as unknown as TokenResponse,
            isAnonAuth: false,
            isAuth: true,
          },
        });

        const userInfo = await twitchService.getUserInfo(authToken);

        setUser(userInfo);
        twitchApi.defaults.headers.common.Authorization = `Bearer ${authToken}`;
      }
    };

    getTokens();
  }, [authToken, anonToken]);

  const getAnonToken = async () => {
    const { access_token } = await twitchService.getDefaultToken();
    setState({
      ready: true,
      auth: {
        anonToken: access_token,
        isAnonAuth: true,
        isAuth: false,
      },
    });

    SecureStore.setItemAsync(StorageKeys.anonToken, access_token);
    twitchApi.defaults.headers.common.Authorization = `Bearer ${access_token}`;
  };

  // const validateToken = async () => {
  //   if (!state.auth?.token) {
  //     return;
  //   }

  //   const isValid = await twitchService.validateToken(
  //     state.auth.token.accessToken,
  //   );

  //   if (!isValid) {
  //     // token is invalid, remove it and get anon token
  //     setState({
  //       ready: false,
  //       auth: {
  //         isAuth: false,
  //         token: undefined,
  //       },
  //     });
  //     getAnonToken();
  //   }

  //   // token needs to be refreshed as it has expired
  //   if (
  //     state.auth.token &&
  //     (state.auth.token.expiresIn as number) < Date.now()
  //   ) {
  //     const refreshedToken = await twitchService.getRefreshToken(
  //       state.auth.token.refreshToken as string,
  //     );
  //     setState({
  //       ready: true,
  //       auth: {
  //         isAuth: true,
  //         isAnonAuth: false,
  //         // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  //         // @ts-ignore
  //         token: refreshedToken,
  //       },
  //     });
  //     logger.info('refreshing token');
  //     // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  //     // @ts-ignore
  //     setUser(await twitchService.getUserInfo(refreshedToken.accessToken));

  //     SecureStore.setItemAsync(StorageKeys.authToken, refreshedToken);
  //     twitchApi.defaults.headers.common.Authorization = `Bearer ${state.auth.token.accessToken}`;
  //   }

  //   // token is valid and not expired
  //   setState({
  //     ready: true,
  //     auth: {
  //       isAuth: true,
  //       isAnonAuth: false,
  //       token: state.auth.token,
  //     },
  //   });

  //   setUser(await twitchService.getUserInfo(state.auth.token.accessToken));

  //   await SecureStore.setItemAsync(
  //     StorageKeys.authToken,
  //     state.auth.token.accessToken,
  //   );
  //   setAuthToken(state.auth.token);
  //   twitchApi.defaults.headers.common.Authorization = `Bearer ${state.auth.token.accessToken}`;
  // };

  const getToken = async (key: StorageKey) => {
    return SecureStore.getItemAsync(key);
  };

  const login = async (response: AuthSessionResult | null) => {
    logger.info('[authcontext] login');
    if (response?.type !== 'success') {
      return null;
    }

    if (!response.authentication) {
      return null;
    }

    setState({
      ready: true,
      auth: {
        isAuth: true,
        isAnonAuth: false,
        token: response.authentication,
      },
    });

    // eslint-disable-next-line no-shadow
    const user = await twitchService.getUserInfo(
      response.authentication.accessToken,
    );
    setUser(user);

    twitchApi.defaults.headers.common.Authorization = `Bearer ${response.authentication.accessToken}`;

    await SecureStore.setItemAsync(
      StorageKeys.authToken,
      JSON.stringify(response.authentication),
    );

    return null;
  };

  const logout = async () => {
    logger.info('[authContext] logout');
    setState({
      ready: true,
      auth: {
        isAuth: false,
        isAnonAuth: false,
        token: undefined,
      },
    });

    setUser(undefined);
    await SecureStore.deleteItemAsync(StorageKeys.authToken);
    twitchApi.defaults.headers.common.Authorization = undefined;

    await getAnonToken();
  };

  const runAnonToken = async () => {
    await getAnonToken();
  };

  useEffect(() => {
    if (!state.auth?.token) {
      logger.info('no token, getting anon token');

      runAnonToken();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const contextState: AuthContextState = useMemo(() => {
    return {
      auth: state.auth,
      user,
      login,
      logout,
      getToken,
      ready: state.ready,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  return state.ready ? (
    <AuthContext.Provider value={contextState}>{children}</AuthContext.Provider>
  ) : null;
};

export function useAuthContext() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuthContext must be used within a AuthContextProvider');
  }

  return context;
}
