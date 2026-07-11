import type { ComponentType } from 'react';

import { Redirect } from 'expo-router';

import { useAuthContext } from '@app/context/AuthContext';
import { useRemoteConfig } from '@app/hooks/firebase/useRemoteConfig';
import { isDevToolsEnabled } from '@app/utils/devTools/isDevToolsEnabled';

export { isDevToolsEnabled } from '@app/utils/devTools/isDevToolsEnabled';

function normaliseLogin(value?: string | null): string {
  return value?.trim().toLowerCase() ?? '';
}

export function isAdminLogin(
  login: string | null | undefined,
  admins: readonly string[],
): boolean {
  const normalised = normaliseLogin(login);
  if (!normalised) {
    return false;
  }
  return admins.some(admin => normaliseLogin(admin) === normalised);
}

export type DevToolsAccess = 'enabled' | 'denied' | 'pending';

export function useDevToolsAccess(): DevToolsAccess {
  const { ready, user } = useAuthContext();
  const { config, isLoading } = useRemoteConfig();

  if (isDevToolsEnabled) {
    return 'enabled';
  }
  if (isAdminLogin(user?.login, config.admins.value)) {
    return 'enabled';
  }
  // The admin list comes from remote config and the login from restored auth.
  // Until both have settled, "not an admin" is indistinguishable from "not
  // loaded yet", so hold rather than redirect — otherwise an admin opening a
  // gated screen during the initial fetch gets bounced straight back out.
  return !ready || isLoading ? 'pending' : 'denied';
}

export function withDevToolsGate<P extends object>(
  Screen: ComponentType<P>,
): ComponentType<P> {
  if (isDevToolsEnabled) {
    return Screen;
  }

  return function DevToolsGate(props: P) {
    const access = useDevToolsAccess();

    if (access === 'pending') {
      return null;
    }
    if (access === 'denied') {
      return <Redirect href='/tabs/settings' />;
    }
    return <Screen {...props} />;
  };
}
