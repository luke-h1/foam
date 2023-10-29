import { TokenResponse } from 'expo-auth-session';
import React, {
  createContext,
  Dispatch,
  ReactNode,
  SetStateAction,
  useContext,
  useMemo,
  useState,
} from 'react';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
interface User {
  authentication: {
    accessToken: string;
    expiresIn?: number;
    idToken?: string;
    issuedAt: number;
    refreshToken?: string;
    scope: string;
    state: string;
    tokenType: 'Bearer';
  };
  error: string | null;
  errorCode: string | null;
}

interface AuthContextState {
  token?: TokenResponse;
  setToken: Dispatch<SetStateAction<TokenResponse | undefined>>;
}

export const AuthContext = createContext<AuthContextState | undefined>(
  undefined,
);

interface Props {
  children?: ReactNode;
}

export const AuthContextProvider = ({ children }: Props) => {
  const [token, setToken] = useState<TokenResponse>();

  // eslint-disable-next-line no-shadow

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  //   @ts-ignore
  const contextState: AuthContextState = useMemo(() => {
    return {
      setToken,
      token,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  return (
    <AuthContext.Provider value={contextState}>{children}</AuthContext.Provider>
  );
};

export function useAuthContext() {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error('useAuthContext must be used within a AuthContextProvider');
  }

  return context;
}
