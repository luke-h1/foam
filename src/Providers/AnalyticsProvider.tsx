import { PropsWithChildren, useEffect } from 'react';
import { Platform } from 'react-native';

import { disableTracking, enableTracking, vexo } from 'vexo-analytics';

import { usePreference } from '@app/store/preferenceStore';
import { logger } from '@app/utils/logger';

const vexoApiKey = process.env.EXPO_PUBLIC_VEXO_API_KEY;

/**
 * Vexo can only be initialized once per process, so track that across
 * remounts. Screen views are auto-tracked by the SDK once initialized.
 *
 * Web is skipped: `enableTracking` / `disableTracking` are no-op stubs there,
 * so opt-out cannot be honored after `vexo()` runs.
 */
let vexoInitialized = false;

/**
 * Web stubs return `undefined` instead of a Promise; normalize so callers can
 * always `.catch`.
 */
function setTrackingEnabled(enabled: boolean) {
  return Promise.resolve(enabled ? enableTracking() : disableTracking());
}

export function AnalyticsProvider({ children }: PropsWithChildren) {
  const analyticsEnabled = usePreference('analyticsEnabled');

  useEffect(() => {
    if (!vexoApiKey || Platform.OS === 'web') {
      return;
    }

    if (!vexoInitialized) {
      if (!analyticsEnabled) {
        return;
      }
      vexo(vexoApiKey);
      vexoInitialized = true;
    }

    void setTrackingEnabled(analyticsEnabled).catch(error => {
      logger.main.warn('Failed to update Vexo tracking state', error);
    });
  }, [analyticsEnabled]);

  return <>{children}</>;
}
