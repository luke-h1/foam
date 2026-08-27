import type { ComponentType } from 'react';

import { Redirect } from 'expo-router';

import { useAuthContext } from '@app/context/AuthContext';
import { useRemoteConfig } from '@app/hooks/firebase/useRemoteConfig';
import { normaliseChatUsername } from '@app/utils/chat/chatUsernames/normaliseChatUsername';
import { isDevToolsEnabled } from '@app/utils/devTools/isDevToolsEnabled';

export { isDevToolsEnabled } from '@app/utils/devTools/isDevToolsEnabled';

export function isAdminLogin(
  login: string | null | undefined,
  admins: readonly string[],
): boolean {
  const normalised = normaliseChatUsername(login);
  if (!normalised) {
    return false;
  }
  return admins.some(admin => normaliseChatUsername(admin) === normalised);
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
  // Until remote config and restored auth settle, "not an admin" is
  // indistinguishable from "not loaded yet" - hold rather than redirect so an
  // admin isn't bounced out during the initial fetch.
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
