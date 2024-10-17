import theme from '@app/styles/theme';
import { ReactNode } from 'react';
import { ActivityIndicator, StyleSheet, ViewStyle } from 'react-native';

interface Props {
  children: ReactNode;
  color?: string;
  loading?: boolean;
  style?: ViewStyle;
  size?: 'small' | 'large';
}

export default function LoadingSpinner({
  children,
  color,
  loading = true,
  size = 'large',
  style,
}: Props) {
  return loading ? (
    <ActivityIndicator
      size={size}
      color={color}
      style={[styles.loadingSpinner, style]}
    />
  ) : (
    children
  );
}

const styles = StyleSheet.create<{
  loadingSpinner: ViewStyle;
}>({
  loadingSpinner: {
    flex: 1,
    marginBottom: theme.spacing.md,
  },
});
