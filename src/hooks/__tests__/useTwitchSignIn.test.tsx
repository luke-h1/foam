import { AuthContext, type AuthContextState } from '@app/context/AuthContext';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import { useState, type PropsWithChildren } from 'react';
import { toast } from 'sonner-native';
import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useAuthRequest } from 'expo-auth-session';
import { useTwitchSignIn } from '../useTwitchSignIn';

jest.mock('expo-constants', () => ({
  expoConfig: {
    extra: {
      EXPO_PUBLIC_AUTH_PROXY_API_BASE_URL: 'https://auth.example.com/api',
      EXPO_PUBLIC_TWITCH_CLIENT_ID: 'client-id',
    },
  },
}));

jest.mock('expo-auth-session', () => ({
  ResponseType: {
    Token: 'token',
  },
  useAuthRequest: jest.fn(),
}));

jest.mock('expo-web-browser', () => ({
  maybeCompleteAuthSession: jest.fn(),
  openAuthSessionAsync: jest.fn(),
}));

jest.mock('expo-router', () => ({
  router: {
    replace: jest.fn(),
  },
}));

jest.mock('sonner-native', () => ({
  toast: {
    error: jest.fn(),
    success: jest.fn(),
  },
}));

jest.mock('@app/services/sentry-service', () => ({
  sentryService: {
    captureMessage: jest.fn(),
  },
}));

const mockedUseAuthRequest = jest.mocked(useAuthRequest);
const mockedOpenAuthSessionAsync = jest.mocked(WebBrowser.openAuthSessionAsync);
const mockedToast = jest.mocked(toast);
const mockedRouter = jest.mocked(router);

describe('useTwitchSignIn', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('completes a successful auth response once when auth context re-renders', async () => {
    const authResult = {
      type: 'success',
      params: {
        access_token: 'token-123',
      },
      url: 'foam://auth#access_token=token-123',
      authentication: {
        accessToken: 'token-123',
        expiresIn: 3600,
        tokenType: 'bearer',
      },
    } as const;

    const request = {
      url: 'https://id.twitch.tv/oauth2/authorize',
      parseReturnUrl: jest.fn(() => authResult),
    };
    const loginWithTwitch = jest.fn();

    mockedUseAuthRequest.mockReturnValue([request, null, jest.fn()] as never);
    mockedOpenAuthSessionAsync.mockResolvedValue({
      type: 'success',
      url: authResult.url,
    } as never);

    function Wrapper({ children }: PropsWithChildren) {
      const [version, setVersion] = useState(0);

      const contextValue: AuthContextState = {
        authState: undefined,
        fetchAnonToken: jest.fn(),
        loginWithTwitch: async response => {
          loginWithTwitch(response);
          setVersion(currentVersion => currentVersion + 1);
          return null;
        },
        logout: jest.fn(),
        populateAuthState: jest.fn(),
        ready: version >= 0,
        user: undefined,
      };

      return (
        <AuthContext.Provider value={contextValue}>
          {children}
        </AuthContext.Provider>
      );
    }

    const { result } = renderHook(() => useTwitchSignIn(), {
      wrapper: Wrapper,
    });

    await act(async () => {
      await result.current.startSignIn();
    });

    await waitFor(() => {
      expect(loginWithTwitch).toHaveBeenCalledTimes(1);
      expect(mockedToast.success).toHaveBeenCalledTimes(1);
      expect(mockedRouter.replace).toHaveBeenCalledWith('/tabs/following');
    });
  });
});
