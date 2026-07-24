import { PropsWithChildren, useEffect, useRef } from 'react';

import { usePathname } from 'expo-router';

import {
  logAnalyticsScreenView,
  setAnalyticsEnabled,
} from '@app/hooks/firebase/analytics';
import { usePreference } from '@app/store/preferenceStore';

function ScreenAnalytics() {
  const pathname = usePathname();
  const previousPathnameRef = useRef<string | null>(null);

  useEffect(() => {
    if (!pathname || previousPathnameRef.current === pathname) {
      return;
    }

    previousPathnameRef.current = pathname;
    void logAnalyticsScreenView(pathname);
  }, [pathname]);

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
