/**
 * Faithful fake of the parts of expo-constants this app reads. The real
 * module resolves native ExponentConstants/EXDevLauncher bindings at import
 * time, which aren't registered under Jest, so importing it for real throws
 * before a test body ever runs.
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
