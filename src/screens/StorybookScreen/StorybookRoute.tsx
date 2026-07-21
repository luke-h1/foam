import type { ComponentType } from 'react';

import { Redirect } from 'expo-router';

/**
 * Storybook must stay out of production bundles. The require below is only
 * reachable when EXPO_PUBLIC_APP_VARIANT folds to a dev-tools variant at
 * build time, so Metro excludes the storybook dependency chain (~3MB of
 * minified JS) from production/testflight bundles entirely. The conditions
 * must stay inline literals in this file - hoisting them into a shared
 * constant (e.g. isDevToolsEnabled) defeats Metro's constant folding.
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
