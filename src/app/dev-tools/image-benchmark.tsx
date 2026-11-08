import type { ComponentType } from 'react';

import { Redirect } from 'expo-router';

let ImageBenchmarkRoute: ComponentType = function ImageBenchmarkUnavailable() {
  return <Redirect href='/tabs/settings' />;
};

if (
  process.env.EXPO_PUBLIC_APP_VARIANT === 'development' ||
  process.env.EXPO_PUBLIC_APP_VARIANT === 'internal' ||
  process.env.EXPO_PUBLIC_APP_VARIANT === 'e2e'
) {
  ImageBenchmarkRoute =
    require('@app/screens/dev-tools/ImageBenchmarkScreen').ImageBenchmarkScreen;
}

export default ImageBenchmarkRoute;
