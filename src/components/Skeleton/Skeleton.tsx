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
    backgroundColor: theme.colors.black.bgAlpha,
    borderCurve: 'continuous',
    borderRadius: theme.radii.md,
    opacity: 0.3,
  },
});
