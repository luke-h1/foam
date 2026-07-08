import { memo, useCallback } from 'react';
import { type GestureResponderEvent, Pressable } from 'react-native';

import { EmoteCell } from './EmoteCell';
import { EMOTE_CELL_GAP } from './emoteSheetLayout';
import { emoteSheetStyles as styles } from './emoteSheetStyles';
import type { EmotePickerItem } from './emoteSheetTypes';

function EmoteRowComponent({
  cellSize,
  items,
  onPress,
}: {
  cellSize: number;
  items: EmotePickerItem[];
  onPress: (item: EmotePickerItem) => void;
}) {
  // One Pressable per row instead of one per cell: on a busy sheet this drops
  // the recycled window from N gesture handlers per row to one. The tapped
  // emote is resolved from the touch x-position against the fixed cell stride.
  const handlePress = useCallback(
    (event: GestureResponderEvent) => {
      const stride = cellSize + EMOTE_CELL_GAP;
      const index = Math.floor(event.nativeEvent.locationX / stride);
      const item = items[index];
      if (item !== undefined) {
        onPress(item);
      }
    },
    [cellSize, items, onPress],
  );

  return (
    <Pressable style={styles.emoteRow} onPress={handlePress}>
      {items.map((item, index) => (
        <EmoteCell
          key={typeof item === 'string' ? `emoji-${index}-${item}` : item.id}
          cellSize={cellSize}
          item={item}
        />
      ))}
    </Pressable>
  );
}

export const EmoteRow = memo(EmoteRowComponent);
