import type { ComponentType } from 'react';

import { Redirect } from 'expo-router';

import { useDevToolsAccess } from '@app/hooks/use-dev-tools-access';
import { isDevToolsEnabled } from '@app/utils/dev-tools/isDevToolsEnabled';

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
