import 'expo-dev-client';
import NetInfo from '@react-native-community/netinfo';
import {
  onlineManager,
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query';
import { useFonts } from 'expo-font';
import { activateKeepAwakeAsync } from 'expo-keep-awake';
import * as SplashScreen from 'expo-splash-screen';
import React, { useLayoutEffect, useState } from 'react';
import { LogBox } from 'react-native';
import {
  initialWindowMetrics,
  SafeAreaProvider,
} from 'react-native-safe-area-context';
import CustomToast from './components/CustomToast';
import OTAUpdates from './components/OTAUpdates';
import Config from './config';
import { AuthContextProvider } from './context/AuthContext';
import useChangeScreenOrientation from './hooks/useChangeScreenOrientation';
import { useOnAppStateChange } from './hooks/useOnAppStateChange';
import { AppNavigator } from './navigators/AppNavigator';
import { useNavigationPersistence } from './navigators/navigationUtilities';
import { ErrorBoundary } from './screens/ErrorScreen/ErrorBoundary';
import { customFontsToLoad } from './styles';
import { deleteTokens } from './utils/deleteTokens';
import { storage } from './utils/storage';

SplashScreen.preventAutoHideAsync();

export const NAVIGATION_PERSISTENCE_KEY = 'NAVIGATION_STATE';

interface AppProps {
  hideSplashScreen: () => Promise<void>;
}

export default function App(props: AppProps) {
  const queryClient = new QueryClient();
  const shouldDelete = false;

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

  const { hideSplashScreen } = props;

  const {
    initialNavigationState,
    onNavigationStateChange,
    isRestored: isNavigationStateRestored,
  } = useNavigationPersistence(storage, NAVIGATION_PERSISTENCE_KEY);

  const [recoveredFromError, setRecoveredFromError] = useState<boolean>(false);

  const [areFontsLoaded] = useFonts(customFontsToLoad);

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
  if (!isNavigationStateRestored || !areFontsLoaded) {
    // TODO: return loading component instead
    return null;
  }

  // otherwise, we're ready to render the app
  return (
    <SafeAreaProvider initialMetrics={initialWindowMetrics}>
      <ErrorBoundary
        catchErrors={Config.catchErrors}
        onReset={() => setRecoveredFromError(true)}
      >
        <AuthContextProvider>
          <QueryClientProvider client={queryClient}>
            <AppNavigator
              initialState={
                recoveredFromError
                  ? { index: 0, routes: [] }
                  : initialNavigationState
              }
              onStateChange={onNavigationStateChange}
            />
            <CustomToast />
            <OTAUpdates />
          </QueryClientProvider>
        </AuthContextProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
