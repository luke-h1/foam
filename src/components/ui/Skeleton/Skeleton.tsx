import { theme } from '@app/styles/themes';
import { View, ViewStyle, StyleSheet } from 'react-native';

interface SkeletonProps {
  style?: ViewStyle;
}

export function Skeleton({ style }: SkeletonProps) {
  return <View style={[styles.skeleton, style]} />;
}

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: theme.colorBlackOverlay,
    borderCurve: 'continuous',
    borderRadius: theme.borderRadius16,
    opacity: 0.3,
  },
});
