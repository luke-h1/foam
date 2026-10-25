import Constants, { ExecutionEnvironment } from 'expo-constants';

export const ENV_SUPPORTS_OTA =
  process.env.EXPO_OS !== 'web' &&
  'window' in globalThis &&
  Constants.executionEnvironment !== ExecutionEnvironment.StoreClient;
