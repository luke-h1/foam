import { PropsWithChildren, useEffect } from 'react';

import { disableTracking, enableTracking, vexo } from 'vexo-analytics';

import { usePreference } from '@app/store/preferenceStore';
import { logger } from '@app/utils/logger';

const vexoApiKey = process.env.EXPO_PUBLIC_VEXO_API_KEY;

/**
 * Vexo can only be initialized once per process, so track that across
 * remounts. Screen views are auto-tracked by the SDK once initialized.
 */
let vexoInitialized = false;

export function AnalyticsProvider({ children }: PropsWithChildren) {
  const analyticsEnabled = usePreference('analyticsEnabled');

  useEffect(() => {
    if (!vexoApiKey) {
      return;
    }

    if (!vexoInitialized) {
      if (!analyticsEnabled) {
        return;
      }
      vexo(vexoApiKey);
      vexoInitialized = true;
      void enableTracking().catch(error => {
        logger.main.warn('Failed to enable Vexo tracking', error);
      });
      return;
    }

    const toggle = analyticsEnabled ? enableTracking : disableTracking;
    void toggle().catch(error => {
      logger.main.warn('Failed to update Vexo tracking state', error);
    });
  }, [analyticsEnabled]);

  return <>{children}</>;
}
