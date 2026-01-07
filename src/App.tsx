import './utils/performance/wdyr';
import './styles/unistyles';

import { createNavigationContainerRef } from '@react-navigation/native';
import * as Sentry from '@sentry/react-native';
import 'expo-dev-client';
import { activateKeepAwakeAsync } from 'expo-keep-awake';
import { useLayoutEffect } from 'react';
import { LogBox } from 'react-native';
import { enableFreeze } from 'react-native-screens';
import { Providers } from './Providers/Providers';
import { ForceUpdateModal } from './components/ForceUpdateModal/ForceUpdateModal';
import { OTAUpdates } from './components/OTAUpdates';
import { useChangeScreenOrientation } from './hooks/useChangeScreenOrientation';
import { useClearExpiredStorageItems } from './hooks/useClearExpiredStorageItems';
import { useOnAppStateChange } from './hooks/useOnAppStateChange';
import { useOnReconnect } from './hooks/useOnReconnect';
import { useRecoveredFromError } from './hooks/useRecoveredFromError';
import { AppNavigator } from './navigators/AppNavigator';
import { useNavigationPersistence } from './navigators/navigationUtilities';
import { twitchApi } from './services/api';
import { navigationIntegration } from './services/sentry-service';
import * as storage from './utils/async-storage/async-storage';
import { deleteTokens } from './utils/authentication/deleteTokens';

enableFreeze(true);

export const NAVIGATION_PERSISTENCE_KEY = 'NAVIGATION_STATE';

function App() {
  useOnAppStateChange();
  useOnReconnect();
  useChangeScreenOrientation();
  useClearExpiredStorageItems();

  const containerRef = createNavigationContainerRef();

  if (__DEV__) {
    LogBox.ignoreAllLogs();
    void activateKeepAwakeAsync();
  }

  const {
    // initialNavigationState,
    onNavigationStateChange,
    // isRestored: isNavigationStateRestored,
  } = useNavigationPersistence(storage, NAVIGATION_PERSISTENCE_KEY);

  const { recoveredFromError, setRecoveredFromError } = useRecoveredFromError();

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
      <ForceUpdateModal />
      <AppNavigator
        onStateChange={onNavigationStateChange}
        onReady={() => {
          navigationIntegration.registerNavigationContainer(containerRef);
        }}
      >
        <OTAUpdates />
      </AppNavigator>
    </Providers>
  );
}

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
export default Sentry.wrap(App);
