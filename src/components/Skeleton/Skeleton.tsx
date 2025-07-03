import { View, ViewStyle } from 'react-native';
import { createStyleSheet, useStyles } from 'react-native-unistyles';

interface SkeletonProps {
  style?: ViewStyle;
}

export function Skeleton({ style }: SkeletonProps) {
  const { styles } = useStyles(stylesheet);
  return <View style={[styles.skeleton, style]} />;
}

const stylesheet = createStyleSheet(theme => ({
  skeleton: {
    backgroundColor: theme.colors.border,
    borderRadius: theme.radii.md,
    opacity: 0.3,
  },
}));
