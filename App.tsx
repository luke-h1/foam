import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import NetInfo from '@react-native-community/netinfo';
import { NavigationContainer } from '@react-navigation/native';
import {
  onlineManager,
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query';
import { activateKeepAwakeAsync } from 'expo-keep-awake';
import * as SplashScreen from 'expo-splash-screen';
import { connectToDevTools } from 'react-devtools-core';
import { LogBox } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import AuthContextProvider from './src/context/AuthContext';
import useChangeScreenOrientation from './src/hooks/useChangeScreenOrientation';
import useOnAppStateChange from './src/hooks/useOnAppStateChange';

SplashScreen.preventAutoHideAsync();

export default function App() {
  const queryClient = new QueryClient();

  useOnAppStateChange();
  useChangeScreenOrientation();

  if (__DEV__) {
    connectToDevTools({
      host: 'localhost',
      port: 8097,
    });

    LogBox.ignoreAllLogs();
    activateKeepAwakeAsync();
  }

  /**
   * supports auto refetch on reconnect for react-query
   */
  onlineManager.setEventListener(setOnline => {
    return NetInfo.addEventListener(state => {
      setOnline(!!state.isConnected);
    });
  });

  /**
   * Dev util to clear auth on simulators
   */
  // deleteTokens();

  return (
    <NavigationContainer>
      <QueryClientProvider client={queryClient}>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <BottomSheetModalProvider>
            <AuthContextProvider>
              <RootNavigator />
            </AuthContextProvider>
          </BottomSheetModalProvider>
        </GestureHandlerRootView>
      </QueryClientProvider>
    </NavigationContainer>
  );
}
