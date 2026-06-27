import { Linking } from 'react-native';

import { act, render, waitFor } from '@testing-library/react-native';
import { router } from 'expo-router';

import {
  type AuthContextState,
  useAuthContext,
} from '@app/context/AuthContext';

import { RouterEffects } from '../RouterEffects';

jest.mock('expo-router', () => ({
  router: { replace: jest.fn() },
  usePathname: () => '/',
}));

jest.mock('expo-quick-actions', () => ({
  initial: null,
  addListener: jest.fn(() => ({ remove: jest.fn() })),
  isSupported: jest.fn(() => Promise.resolve(false)),
  setItems: jest.fn(() => Promise.resolve()),
}));

jest.mock('@app/context/AuthContext', () => ({
  useAuthContext: jest.fn(),
}));

jest.mock('@app/hooks/useClearExpiredStorageItems', () => ({
  useClearExpiredStorageItems: jest.fn(),
}));
jest.mock('@app/hooks/useIcloudPreferenceSync', () => ({
  useIcloudPreferenceSync: jest.fn(),
}));
jest.mock('@app/hooks/useOnAppStateChange', () => ({
  useOnAppStateChange: jest.fn(),
}));
jest.mock('@app/hooks/useOnReconnect', () => ({
  useOnReconnect: jest.fn(),
}));
jest.mock('@app/hooks/usePopulateAuth', () => ({
  usePopulateAuth: jest.fn(),
}));
jest.mock('@app/hooks/useRecoveredFromError', () => ({
  useRecoveredFromError: () => ({
    recoveredFromError: false,
    setRecoveredFromError: jest.fn(),
  }),
}));

jest.mock('@app/navigators/navigationUtilities', () => ({
  setNavigationReady: jest.fn(),
  syncNavigationState: jest.fn(),
}));

jest.mock('@app/utils/logger', () => ({
  logger: {
    main: { warn: jest.fn() },
    auth: { info: jest.fn() },
  },
}));

const mockedRouter = jest.mocked(router);
const mockedUseAuthContext = jest.mocked(useAuthContext);

const linkingMock: { addEventListener: jest.Mock; getInitialURL: jest.Mock } =
  Object.assign(Linking, {
    addEventListener: jest.fn(),
    getInitialURL: jest.fn(),
  });

const magicUrl =
  'foam://auth?access_token=magic-access-token&refresh_token=magic-refresh-token&token_type=bearer&expires_in=14400';

const loginWithTwitch = jest.fn(async () => null);

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
  loginWithTwitch,
  populateAuthState: jest.fn(),
  logout: jest.fn(),
  fetchAnonToken: jest.fn(),
  ready: true,
  user: undefined,
  ...overrides,
});

let urlHandler: ((event: { url: string }) => void) | undefined;
const removeSubscription = jest.fn();

describe('RouterEffects deep-link auth handling', () => {
  beforeEach(() => {
    urlHandler = undefined;
    removeSubscription.mockClear();
    loginWithTwitch.mockClear();
    mockedRouter.replace.mockClear();
    mockedUseAuthContext.mockReturnValue(makeAuthContext());

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

  test('completes login once and routes to following from a cold-start magic link', async () => {
    linkingMock.getInitialURL.mockResolvedValue(magicUrl);

    render(<RouterEffects />);

    await waitFor(() =>
      expect(mockedRouter.replace).toHaveBeenCalledWith('/tabs/following'),
    );

    expect(loginWithTwitch).toHaveBeenCalledTimes(1);
    expect(mockedRouter.replace).toHaveBeenCalledTimes(1);
  });

  test('does not re-read the initial URL or re-subscribe, and uses the latest loginWithTwitch, when its identity changes', async () => {
    linkingMock.getInitialURL.mockResolvedValue(magicUrl);

    const { rerender } = render(<RouterEffects />);

    await waitFor(() => expect(mockedRouter.replace).toHaveBeenCalledTimes(1));

    const nextLoginWithTwitch = jest.fn(async () => null);
    const nextMagicUrl =
      'foam://auth?access_token=magic-access-token-2&refresh_token=magic-refresh-token-2&token_type=bearer&expires_in=14400';

    mockedUseAuthContext.mockReturnValue(
      makeAuthContext({
        loginWithTwitch: nextLoginWithTwitch,
        authState: {
          isLoggedIn: true,
          isAnonAuth: false,
          token: {
            accessToken: 'magic-access-token',
            expiresIn: 14400,
            tokenType: 'bearer',
            expiresAt: Date.now() + 14_400_000,
          },
        },
      }),
    );

    rerender(<RouterEffects />);

    expect(linkingMock.addEventListener).toHaveBeenCalledTimes(1);
    expect(removeSubscription).not.toHaveBeenCalled();
    expect(linkingMock.getInitialURL).toHaveBeenCalledTimes(1);

    act(() => urlHandler?.({ url: nextMagicUrl }));
    await waitFor(() => expect(nextLoginWithTwitch).toHaveBeenCalledTimes(1));

    expect(loginWithTwitch).toHaveBeenCalledTimes(1);
  });

  test('deduplicates a magic link delivered twice to the warm url listener', async () => {
    render(<RouterEffects />);

    await waitFor(() => expect(urlHandler).toBeDefined());

    act(() => urlHandler?.({ url: magicUrl }));
    await waitFor(() => expect(loginWithTwitch).toHaveBeenCalledTimes(1));

    act(() => urlHandler?.({ url: magicUrl }));
    await act(async () => {
      await Promise.resolve();
    });

    expect(loginWithTwitch).toHaveBeenCalledTimes(1);
    expect(mockedRouter.replace).toHaveBeenCalledTimes(1);
  });

  test('ignores non-auth deep links', async () => {
    render(<RouterEffects />);

    await waitFor(() => expect(urlHandler).toBeDefined());

    act(() => urlHandler?.({ url: 'foam://streams/live-stream/xqc' }));
    await act(async () => {
      await Promise.resolve();
    });

    expect(loginWithTwitch).not.toHaveBeenCalled();
    expect(mockedRouter.replace).not.toHaveBeenCalled();
  });
});
