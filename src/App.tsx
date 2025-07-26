/* eslint-disable camelcase */
import {
  SourceCodePro_400Regular,
  SourceCodePro_300Light,
  SourceCodePro_600SemiBold,
  SourceCodePro_700Bold,
  useFonts,
} from '@expo-google-fonts/source-code-pro';

import * as Sentry from '@sentry/react-native';
import 'expo-dev-client';
import { activateKeepAwakeAsync } from 'expo-keep-awake';
import { useLayoutEffect } from 'react';
import { LogBox } from 'react-native';
import { Providers } from './Providers';
import { OTAUpdates } from './components';
import {
  useChangeScreenOrientation,
  useClearExpiredStorageItems,
  useOnAppStateChange,
  useOnReconnect,
  useRecoveredFromError,
} from './hooks';
import { AppNavigator, useNavigationPersistence } from './navigators';
import { twitchApi } from './services/api';
import './styles/unistyles';
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

function App() {
  useOnAppStateChange();
  useOnReconnect();
  useChangeScreenOrientation();
  useClearExpiredStorageItems();

  if (__DEV__) {
    LogBox.ignoreAllLogs();
    void activateKeepAwakeAsync();
  }

  const {
    initialNavigationState,
    onNavigationStateChange,
    // isRestored: isNavigationStateRestored,
  } = useNavigationPersistence(storage, NAVIGATION_PERSISTENCE_KEY);

  const { recoveredFromError, setRecoveredFromError } = useRecoveredFromError();

  useFonts({
    SourceCodePro_400Regular,
    SourceCodePro_300Light,
    SourceCodePro_600SemiBold,
    SourceCodePro_700Bold,
  });

  const shouldDelete = false;
  if (shouldDelete) {
    void deleteTokens();
    twitchApi.removeAuthToken();
  }

  useLayoutEffect(() => {
    if (recoveredFromError) {
      setRecoveredFromError(false);
    }
  });

  /**
   * Before we show the app, we have to wait for our state to be ready
   * In the meantime, don't render anything. This will be the background color set in
   * native by rootView's background color.
   * In iOS: application:didFinishLaunchingWithOptions:
   * In Android: https://stackoverflow.com/a/45838109/204044
   */
  return (
    <Providers>
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
    </Providers>
  );
}

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
export default Sentry.wrap(App);
