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
import { twitchApi } from '../services/api';
import twitchService, { UserInfoResponse } from '../services/twitchService';

const prefix = 'foam-app';

export const StorageKeys = {
  anonToken: `${prefix}-anon-token`,
  authToken: `${prefix}-auth-token`,
} as const;

type StorageKey = keyof typeof StorageKeys;

interface Auth {
  token?: TokenResponse;
  anonToken?: string;
  isAnonAuth?: boolean;
  isAuth?: boolean;
}

interface AuthContextState {
  auth?: Auth;
  user?: UserInfoResponse;
  login: (response: AuthSessionResult | null) => Promise<null>;
  logout: () => Promise<void>;
  getToken: (key: StorageKey) => Promise<string | null>;
  ready: boolean;
}

interface State {
  auth?: Auth;
  ready: boolean;
}

export const AuthContext = createContext<AuthContextState | undefined>(
  undefined,
);

interface AuthContextProviderProps {
  children: ReactNode;
}

export default function AuthContextProvider({
  children,
}: AuthContextProviderProps) {
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

        twitchApi.setToken(anonToken);
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

        const userInfo = await twitchService.getUserInfo();
        setUser(userInfo);
        twitchApi.setToken(authToken);
      }
    };

    getTokens();
  }, [authToken, anonToken]);

  const getAnonToken = async () => {
    // eslint-disable-next-line camelcase
    const { access_token } = await twitchService.getDefaultToken();
    setState({
      ready: true,
      auth: {
        // eslint-disable-next-line camelcase
        anonToken: access_token,
        isAnonAuth: true,
        isAuth: false,
      },
    });

    SecureStore.setItemAsync(StorageKeys.anonToken, access_token);
    // eslint-disable-next-line camelcase
    twitchApi.setToken(access_token);
  };

  const getToken = async (key: StorageKey) => {
    return SecureStore.getItemAsync(key);
  };

  const login = async (response: AuthSessionResult | null) => {
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
    const user = await twitchService.getUserInfo();
    setUser(user);

    twitchApi.setToken(response.authentication.accessToken);

    await SecureStore.setItemAsync(
      StorageKeys.authToken,
      JSON.stringify(response.authentication),
    );

    return null;
  };

  const logout = async () => {
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
    twitchApi.removeToken();
    await getAnonToken();
  };

  useEffect(() => {
    (async () => {
      if (!state.auth?.token) {
        await getAnonToken();
      }
    })();
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
}

export function useAuthContext() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuthContext must be used within a AuthContextProvider');
  }

  return context;
}
