/* eslint-disable global-require */
import { NavigationContainer } from '@react-navigation/native';
import { ThemeProvider } from '@shopify/restyle';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import HomeStackNavigator from './src/navigation/Home/HomeStack';
import { theme } from './src/styles/theme';

export default function App() {
  const [loaded] = useFonts({});

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <NavigationContainer>
      <ThemeProvider theme={theme}>
        <HomeStackNavigator />
      </ThemeProvider>
    </NavigationContainer>
  );
}
