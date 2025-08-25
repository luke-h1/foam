import { Providers } from '@app/Providers';
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

  const shouldDelete = false;
  if (shouldDelete) {
    void deleteTokens();
    twitchApi.removeAuthToken();
  }

  return (
    <Providers>
      <ErrorBoundary>
        <View style={styles.container}>
          <Stack
            initialRouteName="index"
            screenOptions={{ headerShown: false }}
          />
        </View>
      </ErrorBoundary>
    </Providers>
  );
}

const styles = StyleSheet.create((theme, rt) => ({
  container: {
    flex: 1,
    paddingTop: Platform.select({
      ios: 0,
      android: rt.insets.top,
    }),
  },
}));

export default RootLayout;
