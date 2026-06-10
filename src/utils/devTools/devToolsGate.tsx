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

export function withDevToolsGate<P extends object>(
  Screen: ComponentType<P>,
): ComponentType<P> {
  if (isDevToolsEnabled) {
    return Screen;
  }

  return function DevToolsGate() {
    return <Redirect href='/tabs/settings' />;
  };
}
