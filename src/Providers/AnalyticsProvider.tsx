import { PropsWithChildren, useEffect, useRef } from 'react';

import { usePathname } from 'expo-router';

import { useAuthContext } from '@app/context/AuthContext';
import {
  logAnalyticsScreenView,
  setAnalyticsEnabled,
  setAnalyticsUser,
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
  const { user } = useAuthContext();
  const analyticsEnabled = usePreference('analyticsEnabled');

  const userId = user?.id ?? 'anonymous';
  const twitchLogin = user?.login;
  const twitchDisplayName = user?.display_name;

  useEffect(() => {
    void setAnalyticsEnabled(analyticsEnabled);
  }, [analyticsEnabled]);

  useEffect(() => {
    if (!analyticsEnabled) {
      return;
    }

    void setAnalyticsUser({ id: userId, twitchLogin, twitchDisplayName });
  }, [analyticsEnabled, userId, twitchLogin, twitchDisplayName]);

  return (
    <>
      {analyticsEnabled ? <ScreenAnalytics /> : null}
      {children}
    </>
  );
}
