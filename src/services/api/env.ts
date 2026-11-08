import Constants from 'expo-constants';

import { getAppVariant } from '@app/utils/version/getAppVariant';

const expoExtra: Record<string, string | undefined> | undefined =
  Constants.expoConfig?.extra;

export const mockServerUrl = expoExtra?.['MOCK_SERVER_URL'];

export const isE2EMode = !!mockServerUrl;

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
