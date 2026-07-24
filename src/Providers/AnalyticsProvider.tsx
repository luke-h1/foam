import { PropsWithChildren, useEffect, useRef } from 'react';

import { useSegments } from 'expo-router';

import {
  logAnalyticsScreenView,
  setAnalyticsEnabled,
} from '@app/hooks/firebase/analytics';
import { usePreference } from '@app/store/preferenceStore';

function ScreenAnalytics() {
  /**
   * Log the route pattern, not the resolved pathname: segments keep dynamic
   * parts bracketed (/streams/live-stream/[id]), so channel logins and other
   * path params never reach analytics.
   */
  const segments = useSegments();
  const routePattern = `/${segments.join('/')}`;
  const previousRouteRef = useRef<string | null>(null);

  useEffect(() => {
    if (previousRouteRef.current === routePattern) {
      return;
    }

    previousRouteRef.current = routePattern;
    void logAnalyticsScreenView(routePattern);
  }, [routePattern]);

  return null;
}

export function AnalyticsProvider({ children }: PropsWithChildren) {
  const analyticsEnabled = usePreference('analyticsEnabled');

  useEffect(() => {
    void setAnalyticsEnabled(analyticsEnabled);
  }, [analyticsEnabled]);

  return (
    <>
      {analyticsEnabled ? <ScreenAnalytics /> : null}
      {children}
    </>
  );
}
