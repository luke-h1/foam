import { Suspense, lazy } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

// Lazy load Storybook to avoid importing stories before SafeAreaProvider is mounted
const StoryBook = lazy(() => import('../../../.storybook'));

export function StorybookScreen() {
  return (
    <View style={styles.container}>
      <Suspense fallback={<ActivityIndicator style={styles.loader} />}>
        <StoryBook />
      </Suspense>
    </View>
  );
}

const styles = StyleSheet.create(() => ({
  container: {
    flex: 1,
  },
  loader: {
    flex: 1,
  },
}));
