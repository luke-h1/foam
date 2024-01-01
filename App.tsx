/* eslint-disable global-require */
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import NetInfo from '@react-native-community/netinfo';
import { NavigationContainer } from '@react-navigation/native';
import {
  onlineManager,
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query';
import { useFonts } from 'expo-font';
import { activateKeepAwakeAsync } from 'expo-keep-awake';
import * as SplashScreen from 'expo-splash-screen';
import newRelic from 'newrelic-react-native-agent';
import React, { useEffect } from 'react';
import { connectToDevTools } from 'react-devtools-core';
import { LogBox, useColorScheme } from 'react-native';

import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { TamaguiProvider } from 'tamagui';
import { AuthContextProvider } from './src/context/AuthContext';
import useChangeScreenOrientation from './src/hooks/useChangeScreenOrientation';
import { useOnAppStateChange } from './src/hooks/useOnAppStateChange';
import RootNavigator from './src/navigation/RootNavigator';
import config from './tamagui.config';

SplashScreen.preventAutoHideAsync();

export default function App() {
  const queryClient = new QueryClient();
  useOnAppStateChange();
  const scheme = useColorScheme();
  useChangeScreenOrientation();

  const [loaded] = useFonts({
    Inter: require('@tamagui/font-inter/otf/Inter-Medium.otf'),
    InterBold: require('@tamagui/font-inter/otf/Inter-Bold.otf'),
  });

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

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

  // deleteTokens();

  return (
    <NavigationContainer onStateChange={newRelic.onStateChange}>
      <QueryClientProvider client={queryClient}>
        <TamaguiProvider
          config={config}
          disableInjectCSS
          defaultTheme={scheme === 'dark' ? 'dark' : 'light'}
        >
          <GestureHandlerRootView style={{ flex: 1 }}>
            <BottomSheetModalProvider>
              <AuthContextProvider>
                <RootNavigator />
              </AuthContextProvider>
            </BottomSheetModalProvider>
          </GestureHandlerRootView>
        </TamaguiProvider>
      </QueryClientProvider>
    </NavigationContainer>
  );
}
