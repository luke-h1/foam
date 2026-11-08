import Constants, { ExecutionEnvironment } from 'expo-constants';
import { isEnabled, type ReloadScreenOptions } from 'expo-updates';

import { theme } from '@app/styles/themes';

/**
 * Dev builds load JS from Metro, so they never check for or apply an OTA
 * update even when expo-updates is on. Web and Expo Go have no update
 * runtime at all.
 */
export const OTA_UPDATES_ACTIVE =
  isEnabled &&
  !__DEV__ &&
  process.env.EXPO_OS !== 'web' &&
  'window' in globalThis &&
  Constants.executionEnvironment !== ExecutionEnvironment.StoreClient;

export const OTA_RELOAD_SCREEN_OPTIONS = {
  backgroundColor: theme.color.background.dark,
  fade: true,
  spinner: {
    color: theme.colorPrimary,
    size: 'large' as const,
  },
} satisfies ReloadScreenOptions;
