import { ComponentType } from 'react';

import { Redirect } from 'expo-router';

let SyncedEmotesRoute: ComponentType = function SyncedEmotesRoute() {
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
