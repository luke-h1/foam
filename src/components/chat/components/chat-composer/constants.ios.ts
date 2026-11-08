import type { ViewStyle } from 'react-native';

/**
 * Estimated rail item widths. A horizontal LegendList reads
 * `estimatedItemSize` as the item width. The chips also use these values as
 * their minimum width.
 */
export const SUGGESTION_ITEM_WIDTH = {
  command: 128,
  emote: 44,
  user: 128,
};

export const SUGGESTION_LIST_CONTENT_STYLE = {
  gap: 4,
} as const satisfies ViewStyle;
