import type { ReactNode } from 'react';

import { fetchAndActivate } from '@react-native-firebase/remote-config';
import { renderHook, waitFor } from '@testing-library/react-native';

import {
  createAuthContextValue,
  createTestUser,
} from '@app/context/__tests__/__fixtures__/auth-context.fixture';
import {
  type AuthContextState,
  AuthContextTestProvider,
} from '@app/context/auth-context';
import {
  createQueryWrapper,
  resetRemoteConfig,
  serveRemoteConfig,
} from '@app/hooks/firebase/__tests__/__fixtures__/use-remote-config.fixture';
import { useRemoteConfig } from '@app/hooks/firebase/use-remote-config';
import { useDevToolsAccess } from '@app/utils/dev-tools/dev-tools-gate';

function createWrapper(auth: Partial<AuthContextState>) {
  const QueryWrapper = createQueryWrapper();
  const authValue = createAuthContextValue(auth);

  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryWrapper>
        <AuthContextTestProvider {...authValue}>
          {children}
        </AuthContextTestProvider>
      </QueryWrapper>
    );
  };
}

function renderDevToolsAccess(auth: Partial<AuthContextState>) {
  return renderHook(
    () => ({
      access: useDevToolsAccess(),
      isRemoteConfigLoading: useRemoteConfig().isLoading,
    }),
    { wrapper: createWrapper(auth) },
  );
}

beforeEach(() => {
  serveRemoteConfig({ admins: JSON.stringify(['admin_user']) });
});

afterEach(() => {
  resetRemoteConfig();
});

describe('useDevToolsAccess', () => {
  test('grants access to an admin once auth and remote config have loaded', async () => {
    const { result } = renderDevToolsAccess({
      ready: true,
      user: createTestUser({ login: 'admin_user' }),
    });

    await waitFor(() => expect(result.current.access).toBe('enabled'));
  });

  test('holds while remote config is still loading the admin list', async () => {
    let finishFetch: (activated: boolean) => void = () => {};

    jest.mocked(fetchAndActivate).mockReturnValueOnce(
      new Promise<boolean>(resolve => {
        finishFetch = resolve;
      }),
    );

    const { result } = renderDevToolsAccess({
      ready: true,
      user: createTestUser({ login: 'admin_user' }),
    });

    await waitFor(() => expect(fetchAndActivate).toHaveBeenCalledTimes(1));

    expect(result.current).toEqual({
      access: 'pending',
      isRemoteConfigLoading: true,
    });

    finishFetch(true);

    await waitFor(() => expect(result.current.access).toBe('enabled'));
  });

  test('holds while auth has not finished restoring', async () => {
    const { result } = renderDevToolsAccess({ ready: false, user: undefined });

    await waitFor(() =>
      expect(result.current.isRemoteConfigLoading).toBe(false),
    );

    expect(result.current.access).toBe('pending');
  });

  test('denies a non-admin only after everything has settled', async () => {
    const { result } = renderDevToolsAccess({
      ready: true,
      user: createTestUser({ login: 'someone_else' }),
    });

    expect(result.current.access).toBe('pending');

    await waitFor(() => expect(result.current.access).toBe('denied'));
  });

  test('denies a logged-out user once auth has settled', async () => {
    const { result } = renderDevToolsAccess({ ready: true, user: undefined });

    await waitFor(() => expect(result.current.access).toBe('denied'));
  });
});
