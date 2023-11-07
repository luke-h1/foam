import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { NavigationContainer } from '@react-navigation/native';
import { ThemeProvider } from '@shopify/restyle';
import React, { useMemo } from 'react';
import { useColorScheme } from 'react-native';
import { AuthContextProvider } from './src/context/AuthContext';
import RootNavigator from './src/navigation/RootNavigator';
import getTheme from './src/styles/theme';

export default function App() {
  const isDarkMode = useColorScheme() === 'dark';
  const theme = useMemo(() => getTheme(isDarkMode), [isDarkMode]);

  return (
    <ThemeProvider theme={theme}>
      <BottomSheetModalProvider>
        <NavigationContainer>
          <AuthContextProvider>
            <RootNavigator />
          </AuthContextProvider>
        </NavigationContainer>
      </BottomSheetModalProvider>
    </ThemeProvider>
  );
}
