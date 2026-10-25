import type { ViewStyle } from 'react-native';

import { theme } from '@app/styles/themes';

export const chatSheetSurface = {
  borderCurve: 'continuous',
  borderTopLeftRadius: theme.radius.xl,
  borderTopRightRadius: theme.radius.xl,
  overflow: 'hidden',
} as const satisfies ViewStyle;
