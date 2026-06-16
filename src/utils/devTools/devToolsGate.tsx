import { useAuthContext } from '@app/context/AuthContext';
import { useRemoteConfig } from '@app/hooks/firebase/useRemoteConfig';
import { Redirect } from 'expo-router';
import type { ComponentType } from 'react';

/**
 * Dev tooling is only reachable in development, internal, and e2e builds.
 * Production and TestFlight builds must not expose debug screens, even via
 * deep links (App Review guideline 2.3.1 — hidden features).
 */
export const isDevToolsEnabled =
  process.env.EXPO_PUBLIC_APP_VARIANT === 'development' ||
  process.env.EXPO_PUBLIC_APP_VARIANT === 'internal' ||
  process.env.EXPO_PUBLIC_APP_VARIANT === 'e2e';

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

export function useIsDevToolsEnabled(): boolean {
  const { user } = useAuthContext();
  const { config } = useRemoteConfig();

  if (isDevToolsEnabled) {
    return true;
  }
  return isAdminLogin(user?.login, config.admins.value);
}

export function withDevToolsGate<P extends object>(
  Screen: ComponentType<P>,
): ComponentType<P> {
  if (isDevToolsEnabled) {
    return Screen;
  }

  return function DevToolsGate(props: P) {
    const { user } = useAuthContext();
    const { config } = useRemoteConfig();

    if (isAdminLogin(user?.login, config.admins.value)) {
      return <Screen {...props} />;
    }

    return <Redirect href='/tabs/settings' />;
  };
}
