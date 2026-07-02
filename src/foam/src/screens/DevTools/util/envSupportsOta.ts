import Constants, { ExecutionEnvironment } from 'expo-constants';

export const ENV_SUPPORTS_OTA =
  process.env.EXPO_OS !== 'web' &&
  typeof window !== 'undefined' &&
  Constants.executionEnvironment !== ExecutionEnvironment.StoreClient;
