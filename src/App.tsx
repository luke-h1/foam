/* eslint-disable camelcase */
import {
  Inter_300Light,
  Inter_400Regular,
  Inter_600SemiBold,
  Inter_700Bold,
  Inter_900Black,
  useFonts,
} from '@expo-google-fonts/inter';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import * as Sentry from '@sentry/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as Clipboard from 'expo-clipboard';
import 'expo-dev-client';
import { activateKeepAwakeAsync } from 'expo-keep-awake';
import { useLayoutEffect, useState } from 'react';
import { LogBox } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { DevToolsBubble } from 'react-native-react-query-devtools';
import {
  initialWindowMetrics,
  SafeAreaProvider,
} from 'react-native-safe-area-context';
import { Toaster } from 'sonner-native';
import { OTAUpdates } from './components';
import {
  useChangeScreenOrientation,
  useClearExpiredStorageItems,
  useDebugOptions,
  useOnAppStateChange,
  useOnReconnect,
} from './hooks';
import {
  AppNavigator,
  BaseConfig,
  useNavigationPersistence,
} from './navigators';
import { ErrorBoundary } from './screens';
import { twitchApi } from './services/api';
import './styles/unistyles';
import * as storage from './utils/async-storage/async-storage';
import { deleteTokens } from './utils/deleteTokens';

Sentry.init({
  dsn: 'https://c66140f9c8c6c72a91e15582f3086de5@o536134.ingest.us.sentry.io/4508831072780288',
  attachScreenshot: true,
  attachStacktrace: true,
  attachThreads: true,
  enableAppStartTracking: true,
  enableCaptureFailedRequests: true,

  // uncomment the line below to enable Spotlight (https://spotlightjs.com)
  // spotlight: __DEV__,
});

export const NAVIGATION_PERSISTENCE_KEY = 'NAVIGATION_STATE';

interface AppProps {
  hideSplashScreen: () => Promise<void>;
}

function App(props: AppProps) {
  const { hideSplashScreen } = props;

  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: 3,
        refetchOnReconnect: true,
        retryDelay: 2000,
      },
    },
  });

  useOnAppStateChange();
  useOnReconnect();
  useChangeScreenOrientation();
  useClearExpiredStorageItems();

  const { ReactQueryDebug } = useDebugOptions();

  if (__DEV__) {
    LogBox.ignoreAllLogs();
    activateKeepAwakeAsync();
  }

  const {
    initialNavigationState,
    onNavigationStateChange,
    // isRestored: isNavigationStateRestored,
  } = useNavigationPersistence(storage, NAVIGATION_PERSISTENCE_KEY);

  const [recoveredFromError, setRecoveredFromError] = useState<boolean>(false);

  useFonts({
    Inter_900Black,
    Inter_300Light,
    Inter_400Regular,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useLayoutEffect(() => {
    setTimeout(hideSplashScreen, 500);
  });

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useLayoutEffect(() => {
    if (recoveredFromError) {
      setRecoveredFromError(false);
    }
  });

  const shouldDelete = false;
  if (shouldDelete) {
    deleteTokens();
    twitchApi.removeAuthToken();
  }

  /**
   * Before we show the app, we have to wait for our state to be ready
   * In the meantime, don't render anything. This will be the background color set in
   * native by rootView's background color.
   * In iOS: application:didFinishLaunchingWithOptions:
   * In Android: https://stackoverflow.com/a/45838109/204044
   * You can replace with your own loading component
   */

  // otherwise, we're ready to render the app

  return (
    <ErrorBoundary
      catchErrors={BaseConfig.catchErrors}
      onReset={() => setRecoveredFromError(true)}
    >
      <GestureHandlerRootView>
        <BottomSheetModalProvider>
          <SafeAreaProvider initialMetrics={initialWindowMetrics}>
            <QueryClientProvider client={queryClient}>
              <AppNavigator
                initialState={
                  recoveredFromError
                    ? { index: 0, routes: [] }
                    : initialNavigationState
                }
                onStateChange={onNavigationStateChange}
              >
                <OTAUpdates />
              </AppNavigator>
              <Toaster
                position="bottom-center"
                gap={20}
                toastOptions={{
                  actionButtonStyle: {
                    paddingHorizontal: 20,
                  },
                }}
                pauseWhenPageIsHidden
                duration={3000}
                richColors
                visibleToasts={4}
                closeButton
                autoWiggleOnUpdate="toast-change"
                theme="system"
              />
              {ReactQueryDebug?.enabled && (
                <DevToolsBubble
                  onCopy={async text => {
                    try {
                      await Clipboard.setStringAsync(text);
                      return true;
                      // eslint-disable-next-line @typescript-eslint/no-unused-vars
                    } catch (error) {
                      return false;
                    }
                  }}
                />
              )}
            </QueryClientProvider>
          </SafeAreaProvider>
        </BottomSheetModalProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
export default Sentry.wrap(App);
