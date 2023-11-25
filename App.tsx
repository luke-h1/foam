import 'expo-dev-client';
import { NavigationContainer } from '@react-navigation/native';
import { activateKeepAwakeAsync } from 'expo-keep-awake';
import React from 'react';
import { connectToDevTools } from 'react-devtools-core';
import { LogBox } from 'react-native';
import { AuthContextProvider } from './src/context/AuthContext';
import RootNavigator from './src/navigation/RootNavigator';

export default function App() {
  if (__DEV__) {
    connectToDevTools({
      host: 'localhost',
      port: 8097,
    });

    LogBox.ignoreAllLogs();
    activateKeepAwakeAsync();
    // eslint-disable-next-line no-console
    // AsyncStorage.clear().then(() => console.log('AsyncStorage cleared')).catch(e => console.error(e))
  }
  return (
    <NavigationContainer>
      <AuthContextProvider>
        <RootNavigator />
      </AuthContextProvider>
    </NavigationContainer>
  );
}
