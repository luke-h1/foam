import { PropsWithChildren, useEffect } from 'react';

import {
  disableTracking,
  enableTracking,
  identifyDevice,
  vexo,
} from 'vexo-analytics';

import { useAuthContext } from '@app/context/AuthContext';
import { usePreference } from '@app/store/preferenceStore';
import { logger } from '@app/utils/logger';

const vexoApiKey = process.env.EXPO_PUBLIC_VEXO_API_KEY;

/**
 * Vexo can only be initialized once per process, so track that across
 * remounts. Screen views are auto-tracked by the SDK once initialized.
 */
let vexoInitialized = false;

export function AnalyticsProvider({ children }: PropsWithChildren) {
  const { user } = useAuthContext();
  const analyticsEnabled = usePreference('analyticsEnabled');

  useEffect(() => {
    if (!vexoApiKey) {
      return;
    }

    if (!vexoInitialized) {
      // Defer init until the user has opted in so no events are sent while
      // analytics is disabled.
      if (!analyticsEnabled) {
        return;
      }
      vexo(vexoApiKey);
      vexoInitialized = true;
      return;
    }

    const toggle = analyticsEnabled ? enableTracking : disableTracking;
    void toggle().catch(error => {
      logger.main.warn('Failed to update Vexo tracking state', error);
    });
  }, [analyticsEnabled]);

  useEffect(() => {
    if (!vexoApiKey || !vexoInitialized || !analyticsEnabled) {
      return;
    }

    void identifyDevice(user?.id ?? null).catch(error => {
      logger.main.warn('Failed to identify device with Vexo', error);
    });
  }, [analyticsEnabled, user?.id]);

  return <>{children}</>;
}
