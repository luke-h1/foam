import { StyleSheet, View } from 'react-native';
import type {
  ActivityIndicatorProps,
  StyleProp,
  ViewStyle,
} from 'react-native';

import { Host, ProgressView } from '@expo/ui/swift-ui';
import { controlSize, tint } from '@expo/ui/swift-ui/modifiers';

import { theme } from '@app/styles/themes';

interface LoadingStateProps {
  indicatorSize?: ActivityIndicatorProps['size'];
  style?: StyleProp<ViewStyle>;
}

/**
 * Numeric sizes at or above this map to the SwiftUI `large` control size.
 */
const LARGE_SPINNER_MIN_SIZE = 30;

export function LoadingState({
  indicatorSize = 'large',
  style,
}: LoadingStateProps) {
  const isLarge =
    indicatorSize === 'large' ||
    (typeof indicatorSize === 'number' &&
      indicatorSize >= LARGE_SPINNER_MIN_SIZE);

  return (
    <View style={[styles.container, style]} testID='loading-state'>
      <Host matchContents>
        <ProgressView
          modifiers={[
            controlSize(isLarge ? 'large' : 'regular'),
            tint(theme.color.text.dark),
          ]}
        />
      </Host>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    backgroundColor: theme.color.background.dark,
    flex: 1,
    justifyContent: 'center',
  },
});
