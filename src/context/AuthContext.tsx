import { twitchApi } from '@app/services/Client';
import twitchService, { UserInfoResponse } from '@app/services/twitchService';
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

export const StorageKeys = {
  anonToken: 'foam-anonToken',
  authToken: 'foam-authToken',
} as const;

interface AuthContextState {
  auth?: Auth;
  user?: UserInfoResponse;
  login: (response: AuthSessionResult | null) => Promise<null | undefined>;
  logout: () => Promise<void>;
  getAnonToken: () => Promise<void>;
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
    twitchApi.defaults.headers.common.Authorization = `Bearer ${access_token}`;
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

    // TODO: tighten access to axios internals here
    twitchApi.defaults.headers.common.Authorization = undefined;

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
      getAnonToken,
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

interface AuthContextTestProviderProps {
  children: ReactNode;
  user?: UserInfoResponse;
}

export function AuthContextTestProvider({
  children,
  user,
}: AuthContextTestProviderProps) {
  // eslint-disable-next-line react/jsx-no-constructed-context-values
  const state: AuthContextState = {
    getAnonToken: () => Promise.resolve(),
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    login: _result => Promise.resolve(null),
    logout: () => Promise.resolve(),
    ready: true,
    auth: {
      anonToken: '123',
      isAnonAuth: true,
      isAuth: false,
      token: undefined,
    },
    user: user ?? {
      id: '1',
      broadcaster_type: '',
      created_at: '2020',
      description: 'test',
      display_name: 'test_user',
      login: 'test user',
      offline_image_url: 'https://placekitten.com/200/200',
      profile_image_url: 'https://placekitten.com/200/200',
      type: 'user',
      view_count: 0,
    },
  };

  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>;
}
