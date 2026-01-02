import { Suspense, type PropsWithChildren, type ReactNode } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

interface ScreenSuspenseProps extends PropsWithChildren {
  fallback?: ReactNode;
}

function DefaultFallback() {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" />
    </View>
  );
}

/**
 * Suspense boundary for lazy-loaded screens
 * Provides a consistent loading experience across the app
 */
export function ScreenSuspense({ children, fallback }: ScreenSuspenseProps) {
  return (
    <Suspense fallback={fallback ?? <DefaultFallback />}>{children}</Suspense>
  );
}

const styles = StyleSheet.create(theme => ({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.gray.bg,
  },
}));
