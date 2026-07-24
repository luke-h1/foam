import { PropsWithChildren, useEffect, useRef, useState } from 'react';

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

  /**
   * Collection starts disabled (firebase.json) and the SDK drops events logged
   * while it is off, so screen views must wait for the native enable to land.
   */
  const [collectionEnabled, setCollectionEnabled] = useState(false);

  useEffect(() => {
    let cancelled = false;

    void setAnalyticsEnabled(analyticsEnabled).then(() => {
      if (!cancelled) {
        setCollectionEnabled(analyticsEnabled);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [analyticsEnabled]);

  return (
    <>
      {collectionEnabled ? <ScreenAnalytics /> : null}
      {children}
    </>
  );
}
