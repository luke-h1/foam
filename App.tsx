import 'expo-dev-client';
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
import { StatusBar } from 'expo-status-bar';
import React from 'react';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - no types for react-devtools-core
import { LogBox, useColorScheme } from 'react-native';

import { GestureHandlerRootView } from 'react-native-gesture-handler';
import {
  initialWindowMetrics,
  SafeAreaProvider,
} from 'react-native-safe-area-context';
import { AuthContextProvider } from './src/context/AuthContext';
import useChangeScreenOrientation from './src/hooks/useChangeScreenOrientation';
import { useOnAppStateChange } from './src/hooks/useOnAppStateChange';
import RootNavigator from './src/navigation/RootNavigator';
import { deleteTokens } from './src/utils/deleteTokens';

SplashScreen.preventAutoHideAsync();

export default function App() {
  const shouldDelete = false;
  const queryClient = new QueryClient();
  const colorScheme = useColorScheme() || 'light';

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
  return (
    <SafeAreaProvider initialMetrics={initialWindowMetrics}>
      <NavigationContainer>
        <QueryClientProvider client={queryClient}>
          <GestureHandlerRootView style={{ flex: 1 }}>
            <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
            <BottomSheetModalProvider>
              <AuthContextProvider>
                <RootNavigator />
              </AuthContextProvider>
            </BottomSheetModalProvider>
          </GestureHandlerRootView>
        </QueryClientProvider>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
