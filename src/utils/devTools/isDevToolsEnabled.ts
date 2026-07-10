/**
 * Dev tooling is only reachable in development, internal, and e2e builds.
 * Production and TestFlight builds must not expose debug screens, even via
 * deep links (App Review guideline 2.3.1 — hidden features).
 */
export const isDevToolsEnabled =
  process.env.EXPO_PUBLIC_APP_VARIANT === 'development' ||
  process.env.EXPO_PUBLIC_APP_VARIANT === 'internal' ||
  process.env.EXPO_PUBLIC_APP_VARIANT === 'e2e';
