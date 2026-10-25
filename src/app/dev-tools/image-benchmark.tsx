import type { ComponentType } from 'react';

import { Redirect } from 'expo-router';

// The decode benchmark pulls in ~60KB of emote URLs plus the harness. Keep the EXPO_PUBLIC_APP_VARIANT checks as inline literals so Metro can constant-fold the require out of production builds. See storybook-route.tsx.
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
    require('@app/screens/dev-tools/ImageBenchmarkScreen').ImageBenchmarkScreen;
}

export default ImageBenchmarkRoute;
