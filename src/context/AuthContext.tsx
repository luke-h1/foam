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
  login: (response?: AuthSessionResult) => Promise<void>;
  logout: () => Promise<void>;
  getToken: (key: StorageKey) => Promise<string | undefined>;
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
}
