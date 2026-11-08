import { Platform } from 'react-native';

import * as Updates from 'expo-updates';

import { getAppVariant } from '@app/utils/version/getAppVariant';

export const isProductionVariant = (): boolean =>
  getAppVariant() === 'production';

/**
 * The fields every OTA log line and metric carries, so the channel and
 * environment are reported the same way everywhere.
 */
export function otaTelemetryFields() {
  return {
    channel: Updates.channel || 'unknown',
    environment: isProductionVariant() ? 'production' : 'non-production',
    platform: Platform.OS,
  };
}
