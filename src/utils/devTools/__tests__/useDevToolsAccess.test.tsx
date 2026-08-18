import { renderHook } from '@testing-library/react-native';

import {
  createAuthContextValue,
  createTestUser,
} from '@app/context/__tests__/__fixtures__/authContext.fixture';
import * as AuthContextModule from '@app/context/AuthContext';
import type {
  RemoteConfigEntry,
  RemoteConfigType,
  UseRemoteConfigResult,
} from '@app/hooks/firebase/useRemoteConfig';
import * as useRemoteConfigModule from '@app/hooks/firebase/useRemoteConfig';
import { useDevToolsAccess } from '@app/utils/devTools/devToolsGate';

const mockUseAuthContext = jest.spyOn(AuthContextModule, 'useAuthContext');
const mockUseRemoteConfig = jest.spyOn(
  useRemoteConfigModule,
  'useRemoteConfig',
);

afterEach(() => {
  mockUseAuthContext.mockReset();
  mockUseRemoteConfig.mockReset();
});

function entry<T>(value: T): RemoteConfigEntry<T> {
  return { raw: JSON.stringify(value), value, source: 'remote' };
}

function createRemoteConfigResult(
  admins: string[],
  isLoading = false,
): UseRemoteConfigResult {
  const config: RemoteConfigType = {
    updateAppButtonAllowedUsers: entry([]),
    splash: entry({ '7tvUnavailable': false, app: false }),
    minimumVersion: entry({
      android: {
        development: '0.0.0',
        internal: '0.0.0',
        testflight: '0.0.0',
        production: '0.0.0',
      },
      ios: {
        development: '0.0.0',
        internal: '0.0.0',
        testflight: '0.0.0',
        production: '0.0.0',
      },
    }),
    statusPageUrl: entry('https://status.foam-app.com'),
    websiteUrl: entry('https://foam-app.com'),
    admins: entry(admins),
    experiments: entry({}),
    sevenTvPaintRenderer: entry<'off' | 'native' | 'skia'>('native'),
    bundleButtonEnabled: entry({
      ios: {
        development: false,
        internal: true,
        testflight: false,
        production: false,
        e2e: false,
      },
    }),
  };

  return { config, refetch: jest.fn(), isRefetching: false, isLoading };
}

describe('useDevToolsAccess', () => {
  test('grants access to an admin once auth and remote config have loaded', () => {
    mockUseAuthContext.mockReturnValue(
      createAuthContextValue({
        ready: true,
        user: createTestUser({ login: 'admin_user' }),
      }),
    );
    mockUseRemoteConfig.mockReturnValue(
      createRemoteConfigResult(['admin_user']),
    );

    const { result } = renderHook(() => useDevToolsAccess());

    expect(result.current).toBe('enabled');
  });

  test('holds while remote config is still loading the admin list', () => {
    mockUseAuthContext.mockReturnValue(
      createAuthContextValue({
        ready: true,
        user: createTestUser({ login: 'admin_user' }),
      }),
    );
    mockUseRemoteConfig.mockReturnValue(createRemoteConfigResult([], true));

    const { result } = renderHook(() => useDevToolsAccess());

    expect(result.current).toBe('pending');
  });

  test('holds while auth has not finished restoring', () => {
    mockUseAuthContext.mockReturnValue(
      createAuthContextValue({ ready: false, user: undefined }),
    );
    mockUseRemoteConfig.mockReturnValue(
      createRemoteConfigResult(['admin_user']),
    );

    const { result } = renderHook(() => useDevToolsAccess());

    expect(result.current).toBe('pending');
  });

  test('denies a non-admin only after everything has settled', () => {
    mockUseAuthContext.mockReturnValue(
      createAuthContextValue({
        ready: true,
        user: createTestUser({ login: 'someone_else' }),
      }),
    );
    mockUseRemoteConfig.mockReturnValue(
      createRemoteConfigResult(['admin_user']),
    );

    const { result } = renderHook(() => useDevToolsAccess());

    expect(result.current).toBe('denied');
  });

  test('denies a logged-out user once auth has settled', () => {
    mockUseAuthContext.mockReturnValue(
      createAuthContextValue({ ready: true, user: undefined }),
    );
    mockUseRemoteConfig.mockReturnValue(
      createRemoteConfigResult(['admin_user']),
    );

    const { result } = renderHook(() => useDevToolsAccess());

    expect(result.current).toBe('denied');
  });
});
