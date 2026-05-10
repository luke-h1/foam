import '../utils/performance/wdyr';

import * as Sentry from '@sentry/react-native';
import { useFonts } from 'expo-font';
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
import { useEffect, useLayoutEffect } from 'react';
import { Linking, LogBox } from 'react-native';
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
import { parseTwitchUrl } from '../navigators/twitchLinking';
import { theme } from '../styles/themes';
import { getEmojiEmotes } from '../utils/emoji/emojiEmotes';
import { logger } from '../utils/logger';

configureReanimatedLogger({
  level: ReanimatedLogLevel.warn,
  strict: false,
});

enableFreeze(true);

const HOME_SCREEN_QUICK_ACTIONS: RouterAction[] = [
  {
    id: 'following',
    title: 'Following',
    subtitle: 'Open followed channels',
    icon: 'favorite',
    params: {
      href: '/tabs/following',
    },
  },
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

SplashScreen.setOptions({
  duration: 450,
  fade: true,
});

void SplashScreen.preventAutoHideAsync();
WebBrowser.maybeCompleteAuthSession();

function RouterEffects() {
  const pathname = usePathname();
  const { loginWithTwitch } = useAuthContext();
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

    router.replace(href as never);
  });

  useEffect(() => {
    setNavigationReady(true);
    syncNavigationState(pathname);
  }, [pathname]);

  useEffect(() => {
    let cancelled = false;

    void QuickActions.isSupported()
      .then(isSupported => {
        if (!isSupported || cancelled) {
          return;
        }

        return QuickActions.setItems(HOME_SCREEN_QUICK_ACTIONS);
      })
      .catch(error => {
        logger.main.warn('Failed to configure quick actions', error);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    async function handleIncomingUrl(url: string | null) {
      logger.auth.info('[AUTHDBG] RouterEffects.handleIncomingUrl', {
        url,
      });

      if (!url) {
        return;
      }

      if (isAuthCallbackUrl(url)) {
        logger.auth.info('[AUTHDBG] RouterEffects auth callback matched', {
          url,
        });
        const handled = await completeAuthWithCallbackUrl(url, loginWithTwitch);
        logger.auth.info('[AUTHDBG] RouterEffects auth callback handled', {
          url,
          handled,
        });
        if (handled) {
          router.replace('/tabs/following');
        }
        return;
      }

      const link = parseTwitchUrl(url);
      logger.auth.info('[AUTHDBG] RouterEffects parseTwitchUrl result', {
        url,
        link: link ?? null,
      });
      if (!link) {
        return;
      }

      const channelLogin =
        link.type === 'channel' || link.type === 'video'
          ? link.channelLogin
          : null;

      if (channelLogin) {
        router.push(`/streams/live-stream/${channelLogin}`);
      }
    }

    const linkingSubscription = Linking.addEventListener('url', ({ url }) => {
      logger.auth.info('[AUTHDBG] Linking event received', { url });
      void handleIncomingUrl(url);
    });

    void Linking.getInitialURL().then((initialUrl: string | null) => {
      logger.auth.info('[AUTHDBG] Linking.getInitialURL resolved', {
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
  }, [loginWithTwitch]);

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
          <Stack.Screen name="index" />
          <Stack.Screen name="tabs" />
          <Stack.Screen name="streams" />
          <Stack.Screen name="category/[id]" />
          <Stack.Screen name="chat" />
          <Stack.Screen name="login" />
          <Stack.Screen name="auth" />
          <Stack.Screen name="preferences" />
          <Stack.Screen name="storybook" />
          <Stack.Screen name="other" />
          <Stack.Screen name="dev-tools" />
        </Stack>
        <OTAUpdates />
      </Providers>
    </ThemeProvider>
  );
}

function RootLayout() {
  const [fontsLoaded] = useFonts({
    InstrumentSerif_400Regular,
    InstrumentSerif_400Regular_Italic,
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
  });
  const emojiStyle = usePreference('emojiStyle');

  useEffect(() => {
    if (__DEV__) {
      LogBox.ignoreAllLogs();
      void activateKeepAwakeAsync();
    }
  }, []);

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hide();
    }
  }, [fontsLoaded]);

  useEffect(() => {
    chatStore$.emojis.set(getEmojiEmotes(emojiStyle));
  }, [emojiStyle]);

  if (!fontsLoaded) {
    return null;
  }

  return <RootLayoutNav />;
}

export default Sentry.wrap(RootLayout);
