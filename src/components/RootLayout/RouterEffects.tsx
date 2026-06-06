import { useAuthContext } from '@app/context/AuthContext';
import { useClearExpiredStorageItems } from '@app/hooks/useClearExpiredStorageItems';
import { useIcloudPreferenceSync } from '@app/hooks/useIcloudPreferenceSync';
import { useOnAppStateChange } from '@app/hooks/useOnAppStateChange';
import { useOnReconnect } from '@app/hooks/useOnReconnect';
import { usePopulateAuth } from '@app/hooks/usePopulateAuth';
import { useRecoveredFromError } from '@app/hooks/useRecoveredFromError';
import {
  completeAuthWithCallbackUrl,
  isAuthCallbackUrl,
} from '@app/navigators/authLinking';
import {
  setNavigationReady,
  syncNavigationState,
} from '@app/navigators/navigationUtilities';
import { parseTwitchUrl, type TwitchLink } from '@app/navigators/twitchLinking';
import { logger } from '@app/utils/logger';
import type { RouterAction } from 'expo-quick-actions/router';
import { router, usePathname } from 'expo-router';
import * as QuickActions from 'expo-quick-actions';
import { useEffect, useLayoutEffect } from 'react';
import { Linking } from 'react-native';

const logPrefix = '[AUTHDBG] RouterEffects';

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

function getChannelLoginFromTwitchLink(link: TwitchLink): string | null {
  if (!link) {
    return null;
  }

  if (link.type === 'vod' || link.type === 'clip') {
    return null;
  }

  return link.channelLogin;
}

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

  useEffect(() => {
    async function handleIncomingUrl(url: string | null) {
      logger.auth.info(`${logPrefix}.handleIncomingUrl`, {
        url,
      });

      if (!url) {
        return;
      }

      if (isAuthCallbackUrl(url)) {
        logger.auth.info(`${logPrefix} auth callback matched`, {
          url,
        });
        const handled = await completeAuthWithCallbackUrl(url, loginWithTwitch);
        logger.auth.info(`${logPrefix} auth callback handled`, {
          url,
          handled,
        });
        if (handled) {
          router.replace('/tabs/following');
        }
        return;
      }

      const link = parseTwitchUrl(url);
      logger.auth.info(`${logPrefix} parseTwitchUrl result`, {
        url,
        link: link ?? null,
      });
      if (!link) {
        return;
      }

      if (link.type === 'clip') {
        router.push(`/streams/clip/${encodeURIComponent(link.clipId)}`);
        return;
      }

      const channelLogin = getChannelLoginFromTwitchLink(link);

      if (channelLogin) {
        router.push(`/streams/live-stream/${channelLogin}`);
      }
    }

    const linkingSubscription = Linking.addEventListener('url', ({ url }) => {
      logger.auth.info(`${logPrefix} Linking event received`, { url });
      void handleIncomingUrl(url);
    });

    void Linking.getInitialURL().then((initialUrl: string | null) => {
      logger.auth.info(`${logPrefix} Linking.getInitialURL resolved`, {
        initialUrl,
      });

      if (initialUrl) {
        setTimeout(() => {
          void handleIncomingUrl(initialUrl);
        }, 100);
      }
    });

    return () => {
      linkingSubscription.remove();
    };
  }, [loginWithTwitch, ready, authState?.isLoggedIn]);

  return null;
}
