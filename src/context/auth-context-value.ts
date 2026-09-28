import { createContext } from 'react';

import type { AuthSessionResult } from 'expo-auth-session';

import type { DefaultTokenResponse } from '@app/types/twitch/auth';
import type { UserInfoResponse } from '@app/types/twitch/user';
import type { TwitchToken } from '@app/utils/authentication/token-lifecycle';

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

/**
 * Lives apart from the provider so the component file exports only components
 * and Fast Refresh can keep state across edits.
 */
export const AuthContext = createContext<AuthContextState | undefined>(
  undefined,
);
