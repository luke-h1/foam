import type { ComponentType } from 'react';

import { Redirect } from 'expo-router';

/**
 * The require is reachable only when EXPO_PUBLIC_APP_VARIANT folds to a dev-tools variant at build time, so Metro drops ~3MB of storybook JS from production bundles. Keep the conditions inline literals - hoisting them into a shared constant defeats Metro's constant folding.
 */
let StorybookRoute: ComponentType = function StorybookUnavailable() {
  return <Redirect href='/tabs/settings' />;
};

if (
  process.env.EXPO_PUBLIC_APP_VARIANT === 'development' ||
  process.env.EXPO_PUBLIC_APP_VARIANT === 'internal' ||
  process.env.EXPO_PUBLIC_APP_VARIANT === 'e2e'
) {
  StorybookRoute =
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require('@app/screens/StorybookScreen/StorybookScreen').StorybookScreen;
}

export default StorybookRoute;
