/**
 * Fake of the parts of expo-constants this app reads. The real module
 * resolves native ExponentConstants/EXDevLauncher bindings at import time.
 * Jest does not register them, so the real import throws before a test runs.
 */
export const ExecutionEnvironment = {
  Bare: 'bare',
  Standalone: 'standalone',
  StoreClient: 'storeClient',
} as const;

export type ExecutionEnvironment =
  (typeof ExecutionEnvironment)[keyof typeof ExecutionEnvironment];

const Constants = {
  expoConfig: {
    sdkVersion: '52.0.0',
    extra: {
      EXPO_PUBLIC_AUTH_PROXY_API_BASE_URL: 'https://auth-proxy.test',
      EXPO_PUBLIC_TWITCH_CLIENT_ID: 'test-client-id',
    },
  },
  executionEnvironment: ExecutionEnvironment.Bare,
};

export default Constants;
