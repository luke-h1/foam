import { createContext } from 'react';

import type { AuthSessionResult } from 'expo-auth-session';

import type { TwitchToken } from '@app/services/api/tokenLifecycle';
import type { UserInfoResponse } from '@app/types/twitch/user';

export interface AuthState {
  isLoggedIn: boolean;
  isAnonAuth: boolean;
  token: TwitchToken;
}

export type LoginWithTwitchResult =
  | { ok: true }
  | { ok: false; reason: 'cancelled' | 'error' };

export interface AuthContextState {
  user: UserInfoResponse | undefined;
  authState: AuthState | undefined;
  loginWithTwitch: (
    response: AuthSessionResult | null,
  ) => Promise<LoginWithTwitchResult>;
  logout: () => Promise<void>;

  /**
   * Goes up by one each time a sign-in completes. A restore of a stored
   * session at startup does not change it.
   */
  signInId: number;

  ready: boolean;
}

/**
 * Lives apart from the provider so the component file exports only components
 * and Fast Refresh can keep state across edits.
 */
export const AuthContext = createContext<AuthContextState | undefined>(
  undefined,
);
