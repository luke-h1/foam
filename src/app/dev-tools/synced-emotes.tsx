import type { ComponentType } from 'react';

import { Redirect } from 'expo-router';

// Inline EXPO_PUBLIC_APP_VARIANT literals let Metro constant-fold the require
// away, keeping the harness out of production bundles; don't hoist them into a
// shared constant (mirrors StorybookRoute.tsx).
let SyncedEmotesRoute: ComponentType = function SyncedEmotesUnavailable() {
  return <Redirect href='/tabs/settings' />;
};

if (
  process.env.EXPO_PUBLIC_APP_VARIANT === 'development' ||
  process.env.EXPO_PUBLIC_APP_VARIANT === 'internal' ||
  process.env.EXPO_PUBLIC_APP_VARIANT === 'e2e'
) {
  SyncedEmotesRoute =
    require('@app/screens/DevTools/SyncedEmotesScreen').SyncedEmotesScreen;
}

export default SyncedEmotesRoute;
