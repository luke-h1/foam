import type { ViewStyle } from 'react-native';

import { theme } from './themes';

export const toastStyle = {
  backgroundColor: theme.color.surfaceElevated.dark,
  borderCurve: 'continuous',
  borderRadius: theme.radius.lg,
  boxShadow: theme.elevation.floating,
} satisfies ViewStyle;
