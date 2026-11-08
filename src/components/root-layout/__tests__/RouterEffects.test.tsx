import { Linking } from 'react-native';

import { act, render, waitFor } from '@testing-library/react-native';
import { router } from 'expo-router';

import {
  type AuthContextState,
  AuthContextTestProvider,
  type LoginWithTwitchResult,
} from '@app/context/AuthContext';
import { useIsRouterReady } from '@app/hooks/use-is-router-ready';
import { silenceLogger } from '@app/test/silence-logger';
import * as RunWhenIdle from '@app/utils/runWhenIdle';

import { RouterEffects } from '../RouterEffects';

const mockedRouter = jest.mocked(router);

jest.mock('@app/hooks/use-is-router-ready', () => ({
  useIsRouterReady: jest.fn(() => true),
}));

const mockedUseIsRouterReady = jest.mocked(useIsRouterReady);

jest.spyOn(RunWhenIdle, 'runWhenIdle').mockImplementation(task => {
  const timer = setTimeout(() => {
    task();
  }, 0);

  return {
    cancel: () => clearTimeout(timer),
  };
});

silenceLogger();

const linkingMock: { addEventListener: jest.Mock; getInitialURL: jest.Mock } =
  Object.assign(Linking, {
    addEventListener: jest.fn(),
    getInitialURL: jest.fn(),
  });

const magicUrl =
  'foam://auth?access_token=magic-access-token&refresh_token=magic-refresh-token&token_type=bearer&expires_in=14400';

const loginWithTwitch = jest.fn(async (): Promise<LoginWithTwitchResult> => ({
  ok: true,
}));

const makeAuthContext = (
  overrides?: Partial<AuthContextState>,
): AuthContextState => ({
  authState: {
    isLoggedIn: false,
    isAnonAuth: true,
    token: {
      accessToken: 'anon-token',
      expiresIn: 3600,
      tokenType: 'bearer',
      expiresAt: Date.now() + 3_600_000,
    },
  },
  user: undefined,
  loginWithTwitch,
  logout: jest.fn(),
  ready: true,
  signInId: 0,
  ...overrides,
});

function withAuth(authContext: AuthContextState) {
  return (
    <AuthContextTestProvider {...authContext}>
      <RouterEffects />
    </AuthContextTestProvider>
  );
}

let urlHandler: ((event: { url: string }) => void) | undefined;
const removeSubscription = jest.fn();

describe('RouterEffects deep-link auth handling', () => {
  beforeEach(() => {
    urlHandler = undefined;
    removeSubscription.mockClear();
    loginWithTwitch.mockClear();
    mockedRouter.replace.mockClear();

    linkingMock.addEventListener.mockReset();

    linkingMock.addEventListener.mockImplementation((type, handler) => {
      if (type === 'url') {
        urlHandler = handler;
      }

      return { remove: removeSubscription };
    });

    linkingMock.getInitialURL.mockReset();
    linkingMock.getInitialURL.mockResolvedValue(null);
  });

  test('completes login once from a cold-start magic link and leaves navigation to usePopulateAuth', async () => {
    linkingMock.getInitialURL.mockResolvedValue(magicUrl);

    render(withAuth(makeAuthContext()));

    await waitFor(() => expect(loginWithTwitch).toHaveBeenCalledTimes(1));

    expect(mockedRouter.replace).not.toHaveBeenCalled();
  });

  test('does not re-read the initial URL or re-subscribe, and uses the latest loginWithTwitch, when its identity changes', async () => {
    linkingMock.getInitialURL.mockResolvedValue(magicUrl);

    const { rerender } = render(withAuth(makeAuthContext()));

    await waitFor(() => expect(loginWithTwitch).toHaveBeenCalledTimes(1));

    const nextLoginWithTwitch = jest.fn(
      async (): Promise<LoginWithTwitchResult> => ({ ok: true }),
    );

    const nextMagicUrl =
      'foam://auth?access_token=magic-access-token-2&refresh_token=magic-refresh-token-2&token_type=bearer&expires_in=14400';

    rerender(
      withAuth(
        makeAuthContext({
          loginWithTwitch: nextLoginWithTwitch,
          authState: {
            isLoggedIn: true,
            isAnonAuth: false,
            token: {
              accessToken: 'magic-access-token',
              expiresIn: 14_400,
              tokenType: 'bearer',
              expiresAt: Date.now() + 14_400_000,
            },
          },
        }),
      ),
    );

    expect(linkingMock.addEventListener).toHaveBeenCalledTimes(1);

    expect(removeSubscription).not.toHaveBeenCalled();

    expect(linkingMock.getInitialURL).toHaveBeenCalledTimes(1);

    act(() => urlHandler?.({ url: nextMagicUrl }));
    await waitFor(() => expect(nextLoginWithTwitch).toHaveBeenCalledTimes(1));

    expect(loginWithTwitch).toHaveBeenCalledTimes(1);
  });

  test('does not navigate when the magic-link login fails', async () => {
    loginWithTwitch.mockResolvedValueOnce({ ok: false, reason: 'error' });

    render(withAuth(makeAuthContext()));

    await waitFor(() => expect(urlHandler).toBeDefined());

    act(() => urlHandler?.({ url: magicUrl }));
    await waitFor(() => expect(loginWithTwitch).toHaveBeenCalledTimes(1));

    expect(mockedRouter.replace).not.toHaveBeenCalled();
  });

  test('reads the initial URL only after the router has mounted', async () => {
    linkingMock.getInitialURL.mockResolvedValue(magicUrl);
    mockedUseIsRouterReady.mockReturnValue(false);

    const { rerender } = render(withAuth(makeAuthContext()));

    await act(async () => {
      await Promise.resolve();
    });

    expect(linkingMock.getInitialURL).not.toHaveBeenCalled();

    mockedUseIsRouterReady.mockReturnValue(true);
    rerender(withAuth(makeAuthContext()));

    await waitFor(() => expect(loginWithTwitch).toHaveBeenCalledTimes(1));
  });

  test('ignores non-auth deep links', async () => {
    render(withAuth(makeAuthContext()));

    await waitFor(() => expect(urlHandler).toBeDefined());

    act(() => urlHandler?.({ url: 'foam://streams/live-stream/xqc' }));

    await act(async () => {
      await Promise.resolve();
    });

    expect(loginWithTwitch).not.toHaveBeenCalled();

    expect(mockedRouter.replace).not.toHaveBeenCalled();
  });
});
