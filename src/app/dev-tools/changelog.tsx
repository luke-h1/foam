import type { ComponentType } from 'react';

import { Redirect } from 'expo-router';

// Dev-only screen; inline EXPO_PUBLIC_APP_VARIANT literals let Metro constant-fold the require away - do not hoist them (mirrors StorybookRoute.tsx).
let ChangelogRoute: ComponentType = function ChangelogUnavailable() {
  return <Redirect href='/tabs/settings' />;
};

if (
  process.env.EXPO_PUBLIC_APP_VARIANT === 'development' ||
  process.env.EXPO_PUBLIC_APP_VARIANT === 'internal' ||
  process.env.EXPO_PUBLIC_APP_VARIANT === 'e2e'
) {
  ChangelogRoute =
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require('@app/screens/DevTools/ChangelogDemoScreen').ChangelogDemoScreen;
}

export default ChangelogRoute;
