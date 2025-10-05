import { Providers } from '@app/Providers';
import {
  useOnAppStateChange,
  useOnReconnect,
  useChangeScreenOrientation,
  useClearExpiredStorageItems,
  useRecoveredFromError,
} from '@app/hooks';

import { BaseConfig } from '@app/navigators';
import { ErrorBoundary } from '@app/screens';
import { twitchApi } from '@app/services/api';
import { navigationIntegration } from '@app/services/sentry-service';
import { deleteTokens } from '@app/utils';
import { useReactNavigationDevTools } from '@dev-plugins/react-navigation';
import { DarkTheme, ThemeProvider } from '@react-navigation/native';
import * as Sentry from '@sentry/react-native';
import { Stack, useNavigationContainerRef } from 'expo-router';
import { ref } from 'process';
import { useEffect } from 'react';
import { Platform, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

/**
 * Ensure any route can link back to /
 */
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

  useEffect(() => {
    if (navigationRef) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      navigationIntegration.registerNavigationContainer(ref);
    }
  }, [navigationRef]);

  const { setRecoveredFromError } = useRecoveredFromError();

  return (
    <ErrorBoundary
      catchErrors={BaseConfig.catchErrors}
      onReset={() => setRecoveredFromError(true)}
    >
      <ThemeProvider value={DarkTheme}>
        <Providers>
          <AppContent />
        </Providers>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

function AppContent() {
  const shouldDelete = false;
  if (shouldDelete) {
    void deleteTokens();
    twitchApi.removeAuthToken();
  }

  return (
    <View style={styles.container}>
      <Stack initialRouteName="index" screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="(settings)" options={{ headerShown: false }} />

        <Stack.Screen name="streams" options={{ headerShown: false }} />
        <Stack.Screen name="dev-tools" options={{ headerShown: false }} />
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

export default Sentry.wrap(RootLayout);
