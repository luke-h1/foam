import type { ReactNode } from 'react';

import {
  type AuthContextState,
  AuthContextTestProvider,
} from '@app/context/AuthContext';
import type { UserInfoResponse } from '@app/types/twitch/user';

export function createTestUser(
  overrides: Partial<UserInfoResponse> = {},
): UserInfoResponse {
  return {
    broadcaster_type: '',
    created_at: '2020-01-01T00:00:00Z',
    description: '',
    display_name: 'TestUser',
    id: 'viewer-id',
    login: 'testuser',
    offline_image_url: '',
    profile_image_url: '',
    type: '',
    view_count: 0,
    ...overrides,
  };
}

export function createAuthContextValue(
  overrides: Partial<AuthContextState> = {},
): AuthContextState {
  return {
    authState: undefined,
    user: undefined,
    loginWithTwitch: jest.fn(),
    logout: jest.fn(),
    ready: true,
    signInId: 0,
    ...overrides,
  };
}

export function createLoggedInAuthContextValue(
  overrides: Partial<AuthContextState> = {},
): AuthContextState {
  return createAuthContextValue({
    authState: {
      isLoggedIn: true,
      isAnonAuth: false,
      token: {
        accessToken: 'test-token',
        expiresIn: 3600,
        tokenType: 'bearer',
        expiresAt: Date.now() + 3_600_000,
      },
    },
    ...overrides,
  });
}

export function createLoggedOutAuthContextValue(
  overrides: Partial<AuthContextState> = {},
): AuthContextState {
  return createAuthContextValue({
    authState: {
      isLoggedIn: false,
      isAnonAuth: true,
      token: {
        accessToken: '',
        expiresIn: 3600,
        tokenType: 'bearer',
        expiresAt: Date.now() + 3_600_000,
      },
    },
    ...overrides,
  });
}

export function createLoggedInViewerWrapper(userId: string) {
  const authValue = createLoggedInAuthContextValue({
    user: createTestUser({ id: userId }),
  });

  return function LoggedInViewer({ children }: { children: ReactNode }) {
    return (
      <AuthContextTestProvider {...authValue}>
        {children}
      </AuthContextTestProvider>
    );
  };
}
