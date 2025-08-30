import '../styles/unistyles';
import Providers from '@app/Providers/Providers';
import {
  useOnAppStateChange,
  useOnReconnect,
  useChangeScreenOrientation,
  useClearExpiredStorageItems,
} from '@app/hooks';
import { twitchApi } from '@app/services/api';
import { deleteTokens } from '@app/utils';
import { useReactNavigationDevTools } from '@dev-plugins/react-navigation';
import { ErrorBoundary } from '@sentry/react-native';
import { Stack, useNavigationContainerRef } from 'expo-router';
import { Platform, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

// eslint-disable-next-line camelcase
export const unstable_settings = {
  initialRouteName: 'index',
};

function RootLayout() {
  const navigationRef = useNavigationContainerRef();
  // @ts-expect-error - upstream issue with devtool lib
  useReactNavigationDevTools(navigationRef);
  useOnAppStateChange();
  useOnReconnect();
  useChangeScreenOrientation();
  useClearExpiredStorageItems();

  return (
    <ErrorBoundary>
      <Providers>
        <AppContent />
      </Providers>
    </ErrorBoundary>
  );
}

function AppContent() {
  const shouldDelete = false;
  if (shouldDelete) {
    console.log('REMOVED ');
    void deleteTokens();
    twitchApi.removeAuthToken();
  }
  return (
    <View style={styles.container}>
      <Stack initialRouteName="index" screenOptions={{ headerShown: false }}>
        <Stack.Screen name="auth" options={{ headerShown: false }} />

        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />

        <Stack.Screen name="streams" options={{ headerShown: false }} />
        <Stack.Screen name="dev-tools" options={{ headerShown: false }} />
        <Stack.Screen name="preferences" options={{ headerShown: false }} />
      </Stack>
    </View>
  );
}

const styles = StyleSheet.create((theme, rt) => ({
  container: {
    flex: 1,
    backgroundColor: theme.colors.blue.accent,
    paddingTop: Platform.select({
      ios: 0,
      android: rt.insets.top,
    }),
  },
}));

export default RootLayout;
