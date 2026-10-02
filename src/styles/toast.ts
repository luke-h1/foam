import type { ViewStyle } from 'react-native';

import { theme } from './themes';

/**
 * Toasts float over content, so they use the elevated surface and the one
 * elevation instead of a border.
 */
export const toastStyle = {
  backgroundColor: theme.color.surfaceElevated.dark,
  borderCurve: 'continuous',
  borderRadius: theme.radius.lg,
  boxShadow: theme.elevation.floating,
} satisfies ViewStyle;
