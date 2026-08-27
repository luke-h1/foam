import type { ComponentType } from 'react';

import { Redirect } from 'expo-router';

// The decode benchmark drags in ~60KB of emote URLs plus the harness; inline EXPO_PUBLIC_APP_VARIANT literals let Metro constant-fold the require away - do not hoist them (mirrors StorybookRoute.tsx).
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
