import '../utils/performance/wdyr';

import * as Font from 'expo-font';
import { Stack, router, usePathname } from 'expo-router';
import {
  InstrumentSerif_400Regular,
  InstrumentSerif_400Regular_Italic,
} from '@expo-google-fonts/instrument-serif';
import {
  Montserrat_300Light,
  Montserrat_300Light_Italic,
  Montserrat_400Regular,
  Montserrat_400Regular_Italic,
  Montserrat_500Medium,
  Montserrat_500Medium_Italic,
  Montserrat_600SemiBold,
  Montserrat_600SemiBold_Italic,
  Montserrat_700Bold,
  Montserrat_700Bold_Italic,
  Montserrat_800ExtraBold,
  Montserrat_800ExtraBold_Italic,
  Montserrat_900Black,
  Montserrat_900Black_Italic,
} from '@expo-google-fonts/montserrat';
import { DarkTheme, ThemeProvider } from '@react-navigation/native';
import 'expo-dev-client';
import { activateKeepAwakeAsync } from 'expo-keep-awake';
import * as QuickActions from 'expo-quick-actions';
import * as SplashScreen from 'expo-splash-screen';
import * as WebBrowser from 'expo-web-browser';
import type { RouterAction } from 'expo-quick-actions/router';
import { useQuickActionCallback } from 'expo-quick-actions/hooks';
import { isLiquidGlassAvailable } from 'expo-glass-effect';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { InteractionManager, Linking, LogBox } from 'react-native';
import {
  configureReanimatedLogger,
  ReanimatedLogLevel,
} from 'react-native-reanimated';
import { enableFreeze } from 'react-native-screens';
import { Providers } from '../Providers/Providers';
import { ForceUpdateModal } from '../components/ForceUpdateModal/ForceUpdateModal';
import { OTAUpdates } from '../components/OTAUpdates/OTAUpdates';
import { useAuthContext } from '../context/AuthContext';
import { useChangeScreenOrientation } from '../hooks/useChangeScreenOrientation';
import { useClearExpiredStorageItems } from '../hooks/useClearExpiredStorageItems';
import { useOnAppStateChange } from '../hooks/useOnAppStateChange';
import { useOnReconnect } from '../hooks/useOnReconnect';
import { usePopulateAuth } from '../hooks/usePopulateAuth';
import { useRecoveredFromError } from '../hooks/useRecoveredFromError';
import { useIcloudPreferenceSync } from '../hooks/useIcloudPreferenceSync';
import { usePreference } from '../store/preferenceStore';
import { chatStore$ } from '../store/chatStore/state';
import {
  completeAuthWithCallbackUrl,
  isAuthCallbackUrl,
} from '../navigators/authLinking';
import {
  setNavigationReady,
  syncNavigationState,
} from '../navigators/navigationUtilities';
import { parseTwitchUrl, type TwitchLink } from '../navigators/twitchLinking';
import { theme } from '../styles/themes';
import { getEmojiEmotes } from '../utils/emoji/emojiEmotes';
import { logger } from '../utils/logger';

configureReanimatedLogger({
  level: ReanimatedLogLevel.warn,
  strict: false,
});

enableFreeze(true);

SplashScreen.setOptions({
  duration: 450,
  fade: true,
});

void SplashScreen.preventAutoHideAsync();
WebBrowser.maybeCompleteAuthSession();

const criticalFontMap = {
  InstrumentSerif_400Regular,
  InstrumentSerif_400Regular_Italic,
  Montserrat_400Regular,
  Montserrat_400Regular_Italic,
  Montserrat_500Medium,
  Montserrat_500Medium_Italic,
};

const deferredFontMap = {
  Montserrat_300Light,
  Montserrat_300Light_Italic,
  Montserrat_600SemiBold,
  Montserrat_600SemiBold_Italic,
  Montserrat_700Bold,
  Montserrat_700Bold_Italic,
  Montserrat_800ExtraBold,
  Montserrat_800ExtraBold_Italic,
  Montserrat_900Black,
  Montserrat_900Black_Italic,
};

const fontLoadTimeoutMs = 1200;

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
const rootStackScreens = [
  'index',
  'tabs',
  'tabs/following',
  'streams',
  'category/[id]',
  'chat',
  'auth',
  'preferences',
  'storybook',
  'other',
  'dev-tools',
] as const;
const logPrefix = '[AUTHDBG] RouterEffects';

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

  if (link.type === 'vod') {
    return null;
  }

  return link.channelLogin;
}

function RouterEffects() {
  const pathname = usePathname();
  const { authState, loginWithTwitch, ready } = useAuthContext();
  const { recoveredFromError, setRecoveredFromError } = useRecoveredFromError();

  useOnAppStateChange();
  useOnReconnect();
  useChangeScreenOrientation();
  useClearExpiredStorageItems();
  useIcloudPreferenceSync();
  usePopulateAuth();

  useLayoutEffect(() => {
    if (recoveredFromError) {
      setRecoveredFromError(false);
    }
  }, [recoveredFromError, setRecoveredFromError]);

  useQuickActionCallback(action => {
    const href = action.params?.href;
    if (typeof href !== 'string') {
      return;
    }

    router.replace(href);
  });

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

function RootLayoutNav() {
  return (
    <ThemeProvider
      value={{
        ...DarkTheme,
        colors: {
          ...DarkTheme.colors,
          background: theme.color.background.dark,
          border: theme.color.border.dark,
          card: theme.color.background.dark,
          primary: theme.colorDarkGreen,
          text: theme.color.text.dark,
        },
      }}
    >
      <Providers>
        <RouterEffects />
        <ForceUpdateModal />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: {
              backgroundColor: theme.color.background.dark,
            },
          }}
        >
          {rootStackScreens.map(screenName => (
            <Stack.Screen key={screenName} name={screenName} />
          ))}
          <Stack.Screen
            name="auth-sheet"
            options={{
              presentation: 'formSheet',
              sheetGrabberVisible: true,
              sheetAllowedDetents: [0.44, 0.68],
              sheetCornerRadius: theme.borderRadius28,
              contentStyle: {
                backgroundColor: isLiquidGlassAvailable()
                  ? theme.color.transparent.dark
                  : theme.color.background.dark,
              },
            }}
          />
        </Stack>
        <OTAUpdates />
      </Providers>
    </ThemeProvider>
  );
}

function RootLayout() {
  const [fontsLoaded] = Font.useFonts(criticalFontMap);
  const [hasFontTimeoutElapsed, setHasFontTimeoutElapsed] = useState(false);
  const didHideSplash = useRef(false);
  const didScheduleExtraFontLoad = useRef(false);
  const emojiStyle = usePreference('emojiStyle');

  useEffect(() => {
    const timeout = setTimeout(() => {
      setHasFontTimeoutElapsed(true);
    }, fontLoadTimeoutMs);

    return () => {
      clearTimeout(timeout);
    };
  }, []);

  useEffect(() => {
    if (__DEV__) {
      LogBox.ignoreAllLogs();
      void activateKeepAwakeAsync();
    }
  }, []);

  useEffect(() => {
    const shouldRenderNow = fontsLoaded || hasFontTimeoutElapsed;
    if (!shouldRenderNow) {
      return;
    }

    if (!didHideSplash.current) {
      didHideSplash.current = true;
      SplashScreen.hide();
    }

    if (
      didScheduleExtraFontLoad.current ||
      Object.keys(deferredFontMap).length === 0
    ) {
      return;
    }

    didScheduleExtraFontLoad.current = true;
    const task = InteractionManager.runAfterInteractions(() => {
      void Font.loadAsync(deferredFontMap).catch(error => {
        logger.main.warn('Failed to load deferred fonts', error);
      });
    });

    return () => {
      task.cancel();
    };
  }, [fontsLoaded, hasFontTimeoutElapsed]);

  useEffect(() => {
    chatStore$.emojis.set(getEmojiEmotes(emojiStyle));
  }, [emojiStyle]);

  if (!fontsLoaded && !hasFontTimeoutElapsed) {
    return null;
  }

  return <RootLayoutNav />;
}

export default RootLayout;
