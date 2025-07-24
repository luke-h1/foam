/* eslint-disable camelcase */
import {
  SourceCodePro_400Regular,
  SourceCodePro_300Light,
  SourceCodePro_600SemiBold,
  SourceCodePro_700Bold,
  useFonts,
} from '@expo-google-fonts/source-code-pro';

import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import * as Sentry from '@sentry/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as Clipboard from 'expo-clipboard';
import 'expo-dev-client';
import { activateKeepAwakeAsync } from 'expo-keep-awake';
import { useLayoutEffect, useState } from 'react';
import { LogBox } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
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
import { setupBackgroundUpdates } from './utils';
import * as storage from './utils/async-storage/async-storage';
import { deleteTokens } from './utils/authentication/deleteTokens';

Sentry.init({
  dsn: 'https://c66140f9c8c6c72a91e15582f3086de5@o536134.ingest.us.sentry.io/4508831072780288',
  attachScreenshot: true,
  attachStacktrace: true,
  attachThreads: true,
  enableAppStartTracking: true,
  enableCaptureFailedRequests: true,
  spotlight: __DEV__,
  enableAutoPerformanceTracing: true,
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
        retry: 5,
        refetchOnReconnect: true,
        retryDelay: 3000,
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
    void activateKeepAwakeAsync();
  }

  const {
    initialNavigationState,
    onNavigationStateChange,
    // isRestored: isNavigationStateRestored,
  } = useNavigationPersistence(storage, NAVIGATION_PERSISTENCE_KEY);

  const [recoveredFromError, setRecoveredFromError] = useState<boolean>(false);

  void setupBackgroundUpdates();
  useFonts({
    SourceCodePro_400Regular,
    SourceCodePro_300Light,
    SourceCodePro_600SemiBold,
    SourceCodePro_700Bold,
  });

  useLayoutEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    setTimeout(hideSplashScreen, 100);
  });

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useLayoutEffect(() => {
    if (recoveredFromError) {
      setRecoveredFromError(false);
    }
  });

  const shouldDelete = false;
  if (shouldDelete) {
    void deleteTokens();
    twitchApi.removeAuthToken();
  }

  /**
   * Before we show the app, we have to wait for our state to be ready
   * In the meantime, don't render anything. This will be the background color set in
   * native by rootView's background color.
   * In iOS: application:didFinishLaunchingWithOptions:
   * In Android: https://stackoverflow.com/a/45838109/204044
   */

  return (
    <ErrorBoundary
      catchErrors={BaseConfig.catchErrors}
      onReset={() => setRecoveredFromError(true)}
    >
      <KeyboardProvider>
        <GestureHandlerRootView>
          <BottomSheetModalProvider>
            <SafeAreaProvider initialMetrics={initialWindowMetrics}>
              <QueryClientProvider client={queryClient}>
                {__DEV__ ? (
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
                ) : (
                  <AppNavigator>
                    <OTAUpdates />
                  </AppNavigator>
                )}

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
      </KeyboardProvider>
    </ErrorBoundary>
  );
}

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
export default Sentry.wrap(App);
