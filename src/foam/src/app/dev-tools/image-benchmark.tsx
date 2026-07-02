import type { ComponentType } from 'react';

import { Redirect } from 'expo-router';

// The decode benchmark drags in the cinna emote workload (~60KB of URLs) and the
// decode harness. Inline EXPO_PUBLIC_APP_VARIANT literals let Metro constant-fold
// the require away, keeping it out of production bundles; don't hoist them into a
// shared constant (mirrors StorybookRoute.tsx).
let ImageBenchmarkRoute: ComponentType = function ImageBenchmarkUnavailable() {
  return <Redirect href='/tabs/settings' />;
};

if (
  process.env.EXPO_PUBLIC_APP_VARIANT === 'development' ||
  process.env.EXPO_PUBLIC_APP_VARIANT === 'internal' ||
  process.env.EXPO_PUBLIC_APP_VARIANT === 'e2e'
) {
  ImageBenchmarkRoute =
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require('@app/screens/DevTools/ImageBenchmarkScreen').ImageBenchmarkScreen;
}

export default ImageBenchmarkRoute;
