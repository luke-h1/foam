import { useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import RNToast, { BaseToast, ToastConfig } from 'react-native-toast-message';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';

export function Toast() {
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();

  const { theme } = useUnistyles();

  const width = screenWidth - theme.spacing.xs * 2;

  const toastConfig: ToastConfig = {
    // eslint-disable-next-line react/no-unstable-nested-components
    success: props => (
      <BaseToast
        {...props}
        contentContainerStyle={styles.container}
        style={[styles.toast, { width }]}
      />
    ),
  };

  return <RNToast config={toastConfig} topOffset={insets.top} />;
}

const styles = StyleSheet.create(theme => ({
  toast: {
    backgroundColor: theme.colors.borderFaint,
    borderLeftWidth: 0,
    borderRadius: theme.spacing.sm,
  },
  container: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
  },
}));
