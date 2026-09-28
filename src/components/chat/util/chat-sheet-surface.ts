import type { ViewStyle } from 'react-native';

import { theme } from '@app/styles/themes';

export const chatSheetSurface = {
  borderCurve: 'continuous',
  borderTopLeftRadius: theme.borderRadius28,
  borderTopRightRadius: theme.borderRadius28,
  overflow: 'hidden',
} as const satisfies ViewStyle;
