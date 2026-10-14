/**
 * Fake of the parts of expo-constants this app reads. The real module
 * resolves native ExponentConstants/EXDevLauncher bindings at import time.
 * Jest does not register them, so the real import throws before a test runs.
 */
export enum ExecutionEnvironment {
  Bare = 'bare',
  Standalone = 'standalone',
  StoreClient = 'storeClient',
}

const Constants = {
  expoConfig: {
    sdkVersion: '52.0.0',
    extra: {},
  },
  executionEnvironment: ExecutionEnvironment.Bare,
};

export default Constants;
