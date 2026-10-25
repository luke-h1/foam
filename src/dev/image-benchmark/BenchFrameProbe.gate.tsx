import type { ComponentType } from 'react';

// Keeps the perf probe (and benchResults' file IO) out of production bundles; inline EXPO_PUBLIC_APP_VARIANT literals let Metro constant-fold the require away - do not hoist them (mirrors StorybookRoute.tsx).
let BenchFrameProbe: ComponentType = function BenchFrameProbeDisabled() {
  return null;
};

if (
  process.env.EXPO_PUBLIC_APP_VARIANT === 'development' ||
  process.env.EXPO_PUBLIC_APP_VARIANT === 'internal' ||
  process.env.EXPO_PUBLIC_APP_VARIANT === 'e2e'
) {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  BenchFrameProbe = require('./BenchFrameProbe').BenchFrameProbe;
}

export { BenchFrameProbe };
