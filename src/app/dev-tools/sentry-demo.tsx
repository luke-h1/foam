import type { ComponentType } from 'react';

import { Redirect } from 'expo-router';

let SentryDemoRoute: ComponentType = function SentryDemoUnavailable() {
  return <Redirect href='/tabs/settings' />;
};

if (
  process.env.EXPO_PUBLIC_APP_VARIANT === 'development' ||
  process.env.EXPO_PUBLIC_APP_VARIANT === 'internal' ||
  process.env.EXPO_PUBLIC_APP_VARIANT === 'e2e'
) {
  SentryDemoRoute =
    require('@app/screens/dev-tools/SentryTestScreen').SentryTestScreen;
}

export default SentryDemoRoute;
