import { theme } from '@app/styles/themes';

export const CHAT_SHEET_BACKGROUND = '#0b0b0d';

export const chatSheetSurface = {
  backgroundColor: CHAT_SHEET_BACKGROUND,
  borderCurve: 'continuous',
  borderTopLeftRadius: theme.borderRadius28,
  borderTopRightRadius: theme.borderRadius28,
  overflow: 'hidden',
} as const;
