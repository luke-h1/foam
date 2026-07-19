import { PropsWithChildren, useEffect, useRef } from 'react';

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

export function AnalyticsProvider({ children }: PropsWithChildren) {
  const { user } = useAuthContext();
  const analyticsEnabled = usePreference('analyticsEnabled');
  const initializedRef = useRef(false);

  useEffect(() => {
    if (!vexoApiKey) {
      return;
    }

    /**
     * Vexo boots once and then auto-tracks Expo Router screens; toggling the
     * preference afterwards flips tracking without tearing the SDK down.
     */
    if (analyticsEnabled && !initializedRef.current) {
      vexo(vexoApiKey);
      initializedRef.current = true;
      return;
    }

    if (!initializedRef.current) {
      return;
    }

    const toggle = analyticsEnabled ? enableTracking : disableTracking;
    void toggle().catch(error => {
      logger.main.warn('Failed to toggle Vexo tracking', error);
    });
  }, [analyticsEnabled]);

  useEffect(() => {
    if (!vexoApiKey || !initializedRef.current || !analyticsEnabled) {
      return;
    }

    void identifyDevice(user?.id ?? null).catch(error => {
      logger.main.warn('Failed to identify Vexo device', error);
    });
  }, [analyticsEnabled, user?.id]);

  return <>{children}</>;
}
