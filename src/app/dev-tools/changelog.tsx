import type { ComponentType } from 'react';

import { Redirect } from 'expo-router';

let ChangelogRoute: ComponentType = function ChangelogUnavailable() {
  return <Redirect href='/tabs/settings' />;
};

if (
  process.env.EXPO_PUBLIC_APP_VARIANT === 'development' ||
  process.env.EXPO_PUBLIC_APP_VARIANT === 'internal' ||
  process.env.EXPO_PUBLIC_APP_VARIANT === 'e2e'
) {
  ChangelogRoute =
    require('@app/screens/dev-tools/ChangelogDemoScreen').ChangelogDemoScreen;
}

export default ChangelogRoute;
