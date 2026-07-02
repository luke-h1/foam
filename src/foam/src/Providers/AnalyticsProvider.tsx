import { PropsWithChildren, useEffect, useRef } from 'react';

import {
  StatsigProviderRN,
  useStatsigClient,
} from '@statsig/react-native-bindings';
import { usePathname } from 'expo-router';

import { useAuthContext } from '@app/context/AuthContext';
import { usePreference } from '@app/store/preferenceStore';
import { logger } from '@app/utils/logger';

const statsigClientKey = process.env.EXPO_PUBLIC_STATSIG_CLIENT_KEY;

function ScreenAnalytics() {
  const pathname = usePathname();
  const previousPathnameRef = useRef<string | null>(null);
  const { client } = useStatsigClient();

  useEffect(() => {
    if (!pathname || previousPathnameRef.current === pathname) {
      return;
    }

    previousPathnameRef.current = pathname;
    client.logEvent('screen_view', undefined, { pathname });
  }, [client, pathname]);

  useEffect(() => {
    return () => {
      void client.shutdown().catch(error => {
        logger.main.warn('Failed to shutdown Statsig analytics', error);
      });
    };
  }, [client]);

  return null;
}

export function AnalyticsProvider({ children }: PropsWithChildren) {
  const { user } = useAuthContext();
  const analyticsEnabled = usePreference('analyticsEnabled');

  if (!statsigClientKey || !analyticsEnabled) {
    return <>{children}</>;
  }

  const statsigUser = {
    userID: user?.id ?? 'anonymous',
    custom: user
      ? {
          twitchLogin: user.login,
          twitchDisplayName: user.display_name,
        }
      : {},
  };

  return (
    <StatsigProviderRN sdkKey={statsigClientKey} user={statsigUser}>
      <ScreenAnalytics />
      {children}
    </StatsigProviderRN>
  );
}
