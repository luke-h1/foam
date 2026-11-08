import type { ViewStyle } from 'react-native';

import { theme } from '@app/styles/themes';

export const SUGGESTION_ITEM_WIDTH = {
  command: 180,
  emote: 130,
  user: 120,
};

export const SUGGESTION_LIST_CONTENT_STYLE = {
  gap: theme.space8,
  paddingRight: theme.space8,
} as const satisfies ViewStyle;
