import type { ComponentType } from 'react';

import { Redirect } from 'expo-router';

// Dev-only screen; inline EXPO_PUBLIC_APP_VARIANT literals let Metro constant-fold the require away - do not hoist them (mirrors StorybookRoute.tsx).
let SentryDemoRoute: ComponentType = function SentryDemoUnavailable() {
  return <Redirect href='/tabs/settings' />;
};

if (
  process.env.EXPO_PUBLIC_APP_VARIANT === 'development' ||
  process.env.EXPO_PUBLIC_APP_VARIANT === 'internal' ||
  process.env.EXPO_PUBLIC_APP_VARIANT === 'e2e'
) {
  SentryDemoRoute =
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require('@app/screens/DevTools/SentryTestScreen').SentryTestScreen;
}

export default SentryDemoRoute;
