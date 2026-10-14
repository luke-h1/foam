import type { ComponentType } from 'react';

import { Redirect } from 'expo-router';

// Dev-only screen. Keep the EXPO_PUBLIC_APP_VARIANT checks as inline literals so Metro can constant-fold the require out of production builds. See storybook-route.tsx.
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
    require('@app/screens/dev-tools/changelog-demo-screen').ChangelogDemoScreen;
}

export default ChangelogRoute;
