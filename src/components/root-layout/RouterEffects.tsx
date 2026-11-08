import { useEffect } from 'react';
import { Linking } from 'react-native';

import * as QuickActions from 'expo-quick-actions';
import { isRouterAction, type RouterAction } from 'expo-quick-actions/router';
import { type Href, router } from 'expo-router';

import {
  type AuthContextState,
  useAuthContext,
} from '@app/context/AuthContext';
import {
  completeAuthWithCallbackUrl,
  isAuthCallbackUrl,
} from '@app/context/authLinking';
import { useClearExpiredStorageItems } from '@app/hooks/use-clear-expired-storage-items';
import { useIcloudPreferenceSync } from '@app/hooks/use-icloud-preference-sync';
import { useIsRouterReady } from '@app/hooks/use-is-router-ready';
import { usePopulateAuth } from '@app/hooks/use-populate-auth';
import { useSyncRef } from '@app/hooks/use-sync-ref';
import { logger } from '@app/utils/logger';
import { runWhenIdle } from '@app/utils/runWhenIdle';

function parseQuickActionHref(action: QuickActions.Action): Href | undefined {
  if (!isRouterAction(action)) {
    return undefined;
  }

  // SAFETY: isRouterAction confirms params.href is a string or pathname object usable as Href.
  return action.params.href as Href;
}

const quickActionsBase: RouterAction[] = [
  {
    id: 'live',
    title: 'Live',
    subtitle: 'Browse live streams',
    icon: 'play',
    params: {
      href: '/tabs/top',
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

function handleAuthCallbackUrl(
  url: string | null | undefined,
  loginWithTwitch: AuthContextState['loginWithTwitch'],
) {
  if (!url || !isAuthCallbackUrl(url)) {
    return;
  }

  completeAuthWithCallbackUrl(url, loginWithTwitch).catch((error: unknown) => {
    logger.main.warn('Failed to complete auth callback', { error });
  });
}

const getHomeQuickActions = (showFollowingAction: boolean): RouterAction[] => {
  return [
    ...(showFollowingAction ? quickActionsAuthenticated : []),
    ...quickActionsBase,
  ];
};

export function RouterEffects() {
  const { authState, loginWithTwitch, ready } = useAuthContext();

  useClearExpiredStorageItems();
  useIcloudPreferenceSync();
  usePopulateAuth();

  useEffect(() => {
    let isMounted = true;

    const handleQuickAction = (action: QuickActions.Action) => {
      if (!isMounted) {
        return;
      }

      const href = parseQuickActionHref(action);

      if (href !== undefined) {
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
    const homeScreenQuickActions = getHomeQuickActions(
      Boolean(ready && authState?.isLoggedIn),
    );

    let cancelled = false;

    const idleTask = runWhenIdle(() => {
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
    });

    return () => {
      cancelled = true;
      idleTask.cancel();
    };
  }, [authState?.isLoggedIn, ready]);

  const loginWithTwitchRef = useSyncRef(loginWithTwitch);
  const routerReady = useIsRouterReady();

  useEffect(() => {
    const subscription = Linking.addEventListener('url', ({ url }) => {
      handleAuthCallbackUrl(url, loginWithTwitchRef.current);
    });

    return () => subscription.remove();
  }, [loginWithTwitchRef]);

  useEffect(() => {
    if (!routerReady) {
      return;
    }

    let cancelled = false;

    void Linking.getInitialURL().then(initialUrl => {
      if (!cancelled) {
        handleAuthCallbackUrl(initialUrl, loginWithTwitchRef.current);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [loginWithTwitchRef, routerReady]);

  return null;
}
