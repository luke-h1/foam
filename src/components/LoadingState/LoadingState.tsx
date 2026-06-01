import { theme } from '@app/styles/themes';
import type {
  ActivityIndicatorProps,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

interface LoadingStateProps {
  indicatorSize?: ActivityIndicatorProps['size'];
  style?: StyleProp<ViewStyle>;
}

export function LoadingState({
  indicatorSize = 'large',
  style,
}: LoadingStateProps) {
  return (
    <View style={[styles.container, style]}>
      <ActivityIndicator size={indicatorSize} color={theme.color.text.dark} />
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
