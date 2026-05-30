import { useAuthContext } from '@app/context/AuthContext';
import { logger } from '@app/utils/logger';
import type { StatsigUser } from '@statsig/client-core';
import {
  StatsigProviderRN,
  useStatsigClient,
} from '@statsig/react-native-bindings';
import { usePathname } from 'expo-router';
import { PropsWithChildren, useEffect, useMemo, useRef } from 'react';

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

  const statsigUser = useMemo<StatsigUser>(() => {
    if (!user) {
      return {
        customIDs: {
          stableID: 'anonymous',
        },
      };
    }

    return {
      userID: user.id,
      custom: {
        twitchLogin: user.login,
        twitchDisplayName: user.display_name,
      },
    };
  }, [user]);

  if (!statsigClientKey) {
    return <>{children}</>;
  }

  return (
    <StatsigProviderRN sdkKey={statsigClientKey} user={statsigUser}>
      <ScreenAnalytics />
      {children}
    </StatsigProviderRN>
  );
}
