import { useEffect, useLayoutEffect } from 'react';
import { Linking } from 'react-native';

import * as QuickActions from 'expo-quick-actions';
import type { RouterAction } from 'expo-quick-actions/router';
import { router, usePathname } from 'expo-router';

import { useAuthContext } from '@app/context/AuthContext';
import { useClearExpiredStorageItems } from '@app/hooks/useClearExpiredStorageItems';
import { useIcloudPreferenceSync } from '@app/hooks/useIcloudPreferenceSync';
import { useLazyRef } from '@app/hooks/useLazyRef';
import { useOnAppStateChange } from '@app/hooks/useOnAppStateChange';
import { useOnReconnect } from '@app/hooks/useOnReconnect';
import { usePopulateAuth } from '@app/hooks/usePopulateAuth';
import { useRecoveredFromError } from '@app/hooks/useRecoveredFromError';
import { useSyncRef } from '@app/hooks/useSyncRef';
import {
  completeAuthWithCallbackUrl,
  isAuthCallbackUrl,
} from '@app/navigators/authLinking';
import {
  beginDeepLinkAuth,
  endDeepLinkAuth,
} from '@app/navigators/deepLinkAuthState';
import {
  setNavigationReady,
  syncNavigationState,
} from '@app/navigators/navigationUtilities';
import { logger } from '@app/utils/logger';

const quickActionsBase: RouterAction[] = [
  {
    id: 'live',
    title: 'Live',
    subtitle: 'Browse live streams',
    icon: 'play',
    params: {
      href: '/tabs/top/streams',
    },
  },
  {
    id: 'search',
    title: 'Search',
    subtitle: 'Find streamers and categories',
    icon: 'search',
    params: {
      href: '/tabs/search',
    },
  },
];

const quickActionsAuthenticated: RouterAction[] = [
  {
    id: 'following',
    title: 'Following',
    subtitle: 'Open followed channels',
    icon: 'favorite',
    params: {
      href: '/tabs/following',
    },
  },
];

const getHomeQuickActions = (showFollowingAction: boolean): RouterAction[] => {
  return [
    ...(showFollowingAction ? quickActionsAuthenticated : []),
    ...quickActionsBase,
  ];
};

export function RouterEffects() {
  const pathname = usePathname();
  const { authState, loginWithTwitch, ready } = useAuthContext();
  const { recoveredFromError, setRecoveredFromError } = useRecoveredFromError();

  useOnAppStateChange();
  useOnReconnect();
  useClearExpiredStorageItems();
  useIcloudPreferenceSync();
  usePopulateAuth();

  useLayoutEffect(() => {
    if (recoveredFromError) {
      setRecoveredFromError(false);
    }
  }, [recoveredFromError, setRecoveredFromError]);

  useEffect(() => {
    let isMounted = true;

    const handleQuickAction = (action: QuickActions.Action) => {
      const href = action.params?.href;
      if (isMounted && typeof href === 'string') {
        router.replace(href);
      }
    };

    if (QuickActions.initial) {
      handleQuickAction(QuickActions.initial);
    }

    const subscription = QuickActions.addListener(handleQuickAction);
    return () => {
      isMounted = false;
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    setNavigationReady(true);
    syncNavigationState(pathname);
  }, [pathname]);

  useEffect(() => {
    const homeScreenQuickActions = getHomeQuickActions(
      Boolean(ready && authState?.isLoggedIn),
    );

    let cancelled = false;

    void QuickActions.isSupported()
      .then(isSupported => {
        if (!isSupported || cancelled) {
          return;
        }

        return QuickActions.setItems(homeScreenQuickActions);
      })
      .catch(error => {
        logger.main.warn('Failed to configure quick actions', error);
      });

    return () => {
      cancelled = true;
    };
  }, [authState?.isLoggedIn, ready]);

  const loginWithTwitchRef = useSyncRef(loginWithTwitch);
  const handledAuthUrlsRef = useLazyRef(() => new Set<string>());
  const pendingAuthUrlsRef = useLazyRef(() => new Set<string>());

  useEffect(() => {
    const handledAuthUrls = handledAuthUrlsRef.current;
    const pendingAuthUrls = pendingAuthUrlsRef.current;
    let cancelled = false;
    let initialUrlTimeout: ReturnType<typeof setTimeout> | undefined;

    async function handleIncomingUrl(url: string | null) {
      if (cancelled || !url || !isAuthCallbackUrl(url)) {
        return;
      }

      if (handledAuthUrls.has(url) || pendingAuthUrls.has(url)) {
        return;
      }
      pendingAuthUrls.add(url);
      beginDeepLinkAuth();

      // Cleanup sits after the try/catch (it always runs; the catch swallows
      // every error) because try/finally is a React Compiler bailout.
      try {
        const handled = await completeAuthWithCallbackUrl(
          url,
          loginWithTwitchRef.current,
        );
        if (handled) {
          handledAuthUrls.add(url);
          if (!cancelled) {
            router.replace('/tabs/following');
          }
        }
      } catch (error) {
        logger.main.warn('Failed to complete auth callback', error);
      }
      pendingAuthUrls.delete(url);
      endDeepLinkAuth();
    }

    const linkingSubscription = Linking.addEventListener('url', ({ url }) => {
      void handleIncomingUrl(url);
    });

    void Linking.getInitialURL().then((initialUrl: string | null) => {
      if (cancelled || !initialUrl) {
        return;
      }
      initialUrlTimeout = setTimeout(() => {
        void handleIncomingUrl(initialUrl);
      }, 100);
    });

    return () => {
      cancelled = true;
      if (initialUrlTimeout) {
        clearTimeout(initialUrlTimeout);
      }
      linkingSubscription.remove();
    };
  }, [handledAuthUrlsRef, loginWithTwitchRef, pendingAuthUrlsRef]);

  return null;
}
