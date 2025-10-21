import { View, ViewStyle } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

interface SkeletonProps {
  style?: ViewStyle;
}

export function Skeleton({ style }: SkeletonProps) {
  return <View style={[styles.skeleton, style]} />;
}

const styles = StyleSheet.create(theme => ({
  skeleton: {
    backgroundColor: theme.colors.black.bgAlpha,
    borderRadius: theme.radii.md,
    opacity: 0.3,
    borderCurve: 'continuous',
  },
}));
