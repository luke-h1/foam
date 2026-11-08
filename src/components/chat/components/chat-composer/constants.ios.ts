import type { ViewStyle } from 'react-native';

export const SUGGESTION_ITEM_WIDTH = {
  command: 128,
  emote: 44,
  user: 128,
};

export const SUGGESTION_LIST_CONTENT_STYLE = {
  gap: 4,
} as const satisfies ViewStyle;
