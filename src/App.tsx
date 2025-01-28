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
import NetInfo from '@react-native-community/netinfo';
import {
  onlineManager,
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query';
import 'expo-dev-client';
import { activateKeepAwakeAsync } from 'expo-keep-awake';
import { useLayoutEffect, useState } from 'react';
import { LogBox, ViewStyle } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import {
  initialWindowMetrics,
  SafeAreaProvider,
} from 'react-native-safe-area-context';
import './styles/unistyles';
import { AppLoading, OTAUpdates, Toast } from './components';
import { useOnAppStateChange, useChangeScreenOrientation } from './hooks';
import {
  useNavigationPersistence,
  AppNavigator,
  BaseConfig,
} from './navigators';
import { ErrorBoundary } from './screens';
import * as storage from './utils/async-storage';
import { deleteTokens } from './utils/deleteTokens';

export const NAVIGATION_PERSISTENCE_KEY = 'NAVIGATION_STATE';

interface AppProps {
  hideSplashScreen: () => Promise<void>;
}

export default function App(props: AppProps) {
  const { hideSplashScreen } = props;

  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: 3,
        refetchOnReconnect: true,
      },
    },
  });
  const shouldDelete = __DEV__;

  useOnAppStateChange();
  useChangeScreenOrientation();

  if (__DEV__) {
    LogBox.ignoreAllLogs();
    activateKeepAwakeAsync();
  }

  /**
   * support auto refetch on network reconnect for react-query
   */
  onlineManager.setEventListener(setOnline => {
    return NetInfo.addEventListener(state => {
      setOnline(!!state.isConnected);
    });
  });

  if (shouldDelete) {
    deleteTokens();
  }

  const {
    initialNavigationState,
    onNavigationStateChange,
    isRestored: isNavigationStateRestored,
  } = useNavigationPersistence(storage, NAVIGATION_PERSISTENCE_KEY);

  const [recoveredFromError, setRecoveredFromError] = useState<boolean>(false);

  const [areFontsLoaded] = useFonts({
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

  if (shouldDelete) {
    deleteTokens();
  }

  /**
   * Before we show the app, we have to wait for our state to be readyy.
   * In the meantime, don't render anything. This will be the background color set in
   * native by rootView's background color.
   * In iOS: application:didFinishLaunchingWithOptions:
   * In Android: https://stackoverflow.com/a/45838109/204044
   * You can replace with your own loading component
   */

  if (!areFontsLoaded || !isNavigationStateRestored) {
    return <AppLoading />;
  }

  // otherwise, we're ready to render the app
  return (
    <ErrorBoundary
      catchErrors={BaseConfig.catchErrors}
      onReset={() => setRecoveredFromError(true)}
    >
      <SafeAreaProvider initialMetrics={initialWindowMetrics}>
        <QueryClientProvider client={queryClient}>
          <GestureHandlerRootView style={$bottomSheetContainer}>
            <BottomSheetModalProvider>
              <AppNavigator
                initialState={
                  recoveredFromError
                    ? { index: 0, routes: [] }
                    : initialNavigationState
                }
                onStateChange={onNavigationStateChange}
              >
                <OTAUpdates />
                <Toast />
              </AppNavigator>
            </BottomSheetModalProvider>
          </GestureHandlerRootView>
        </QueryClientProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}

const $bottomSheetContainer: ViewStyle = {
  flex: 1,
};
