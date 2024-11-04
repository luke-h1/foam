/* eslint-disable */
import { HomeTabsRoutes } from '@app/navigation/Home/HomeTabs';
import { RootRoutes, RootStackParamList } from '@app/navigation/RootStack';
import { twitchApi } from '@app/services/api';
import twitchService, { UserInfoResponse } from '@app/services/twitchService';
import { NavigationProp, useNavigation } from '@react-navigation/native';
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
  const [user, setUser] = useState<UserInfoResponse | undefined>(undefined);
  const [authToken, setAuthToken] = useState<TokenResponse | undefined>(
    undefined,
  );
  const [anonToken, setAnonToken] = useState<string | undefined>(undefined);
  const navigation = useNavigation<NavigationProp<RootRoutes>>();

  const isValidToken = async (token: string | null) => {
    if (!token) {
      return false;
    }
    return twitchService.validateToken(token);
  };

  const { navigate } = useNavigation<NavigationProp<RootStackParamList>>();

  useEffect(() => {
    const getTokens = async () => {
      try {
        const [storedAnonToken, storedAuthToken] = await Promise.all([
          SecureStore.getItemAsync(StorageKeys.anonToken),
          SecureStore.getItemAsync(StorageKeys.authToken),
        ]);

        if (storedAuthToken && (await isValidToken(storedAuthToken))) {
          setAuthToken(JSON.parse(storedAuthToken) as TokenResponse);
          const userInfo = await twitchService.getUserInfo(storedAuthToken);
          setUser(userInfo);
          setState({
            ready: true,
            auth: {
              token: JSON.parse(storedAuthToken) as TokenResponse,
              isAnonAuth: false,
              isAuth: true,
            },
          });
          twitchApi.setAuthToken(storedAuthToken);
          navigate(RootRoutes.Home, {
            screen: HomeTabsRoutes.Top,
          }); // Navigate to the appropriate screen
        } else if (storedAnonToken && (await isValidToken(storedAnonToken))) {
          setAnonToken(storedAnonToken);
          setState({
            ready: true,
            auth: {
              anonToken: storedAnonToken,
              isAnonAuth: true,
              isAuth: false,
            },
          });
          // twitchApi.defaults.headers.common.Authorization = `Bearer ${storedAnonToken}`;
          twitchApi.setAuthToken(storedAnonToken);
        } else {
          await getAnonToken();
        }
      } catch (error) {
        console.error('Error getting tokens:', error);
      }
    };

    getTokens();
  }, []);

  const getAnonToken = async () => {
    try {
      const { access_token } = await twitchService.getDefaultToken();
      setAnonToken(access_token);
      setState({
        ready: true,
        auth: {
          anonToken: access_token,
          isAnonAuth: true,
          isAuth: false,
        },
      });

      await SecureStore.setItemAsync(StorageKeys.anonToken, access_token);
      // twitchApi.defaults.headers.common.Authorization = `Bearer ${access_token}`;
      // twitchApi.authToken = access_token;
      twitchApi.setAuthToken(access_token);
    } catch (error) {
      console.error('Error getting anonymous token:', error);
    }
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

    const user = await twitchService.getUserInfo(
      response.authentication.accessToken,
    );
    setUser(user);

    // twitchApi.defaults.headers.common.Authorization = `Bearer ${response.authentication.accessToken}`;
    // twitchApi.authToken = response.authentication.accessToken;
    twitchApi.setAuthToken(response.authentication.accessToken);

    await SecureStore.setItemAsync(
      StorageKeys.authToken,
      JSON.stringify(response.authentication),
    );

    navigate(RootRoutes.Home, {
      screen: HomeTabsRoutes.Top,
    }); // Navigate to the appropriate screen

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

    // twitchApi.defaults.headers.common.Authorization = undefined;
    // twitchApi.authToken = undefined;
    twitchApi.removeAuthToken();

    await getAnonToken();
  };

  const contextState: AuthContextState = useMemo(() => {
    return {
      auth: state.auth,
      user,
      login,
      logout,
      getAnonToken,
      ready: state.ready,
    };
  }, [state.auth, user]);

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
  const state: AuthContextState = {
    getAnonToken: () => Promise.resolve(),
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
