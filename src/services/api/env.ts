import Constants from 'expo-constants';

import { getAppVariant } from '@app/utils/version/getAppVariant';

/**
 * app.config.ts copies the build env into `extra`. `process.env` is the
 * fallback for code that runs without the Expo config, such as tests. Each
 * `process.env.EXPO_PUBLIC_*` read stays a literal member access, so Metro
 * can inline it.
 */
const expoExtra: Record<string, string | undefined> | undefined =
  Constants.expoConfig?.extra;

export const mockServerUrl = expoExtra?.['MOCK_SERVER_URL'];

export const isE2EMode = !!mockServerUrl;

/**
 * A production build without one of these values cannot sign anyone in, so
 * it fails at startup with the name of the missing variable. Other builds
 * and E2E runs fall back to an empty string.
 */
function requireBuildEnv(name: string, value: string | undefined): string {
  if (value) {
    return value;
  }

  if (getAppVariant() === 'production' && !isE2EMode) {
    throw new Error(`${name} is not set. Add it to the build environment.`);
  }

  return '';
}

export const authProxyBaseUrl = requireBuildEnv(
  'EXPO_PUBLIC_AUTH_PROXY_API_BASE_URL',
  expoExtra?.['EXPO_PUBLIC_AUTH_PROXY_API_BASE_URL'] ??
    process.env.EXPO_PUBLIC_AUTH_PROXY_API_BASE_URL,
);

export const authProxyApiKey = requireBuildEnv(
  'EXPO_PUBLIC_AUTH_PROXY_API_KEY',
  expoExtra?.['EXPO_PUBLIC_AUTH_PROXY_API_KEY'] ??
    process.env.EXPO_PUBLIC_AUTH_PROXY_API_KEY,
);

export const envTwitchClientId = requireBuildEnv(
  'EXPO_PUBLIC_TWITCH_CLIENT_ID',
  expoExtra?.['EXPO_PUBLIC_TWITCH_CLIENT_ID'] ??
    process.env.EXPO_PUBLIC_TWITCH_CLIENT_ID,
);
