import type { ComponentType } from 'react';

// Keeps the synthetic perf probe (and benchResults' file IO) out of production
// bundles: it only ever renders in the dev-gated Chat Perf screen. The inline
// EXPO_PUBLIC_APP_VARIANT literals let Metro constant-fold the require away in
// production/testflight — do not hoist them into a shared constant (mirrors
// StorybookRoute.tsx).
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
