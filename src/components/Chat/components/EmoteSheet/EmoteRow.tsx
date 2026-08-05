import { memo, useCallback } from 'react';
import { type GestureResponderEvent, Pressable } from 'react-native';

import { selection } from '@app/lib/haptics';

import {
  RowVisibilityContext,
  useRowVisibility,
} from '../ChatMessage/rowVisibility';
import { EmoteCell } from './EmoteCell';
import { emoteSheetStyles as styles } from './EmoteSheet.styles';
import { EMOTE_CELL_GAP } from './emoteSheetLayout';
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
  const handlePress = useCallback(
    (event: GestureResponderEvent) => {
      const stride = cellSize + EMOTE_CELL_GAP;
      const index = Math.floor(event.nativeEvent.locationX / stride);
      const item = items[index];
      if (item !== undefined) {
        selection();
        onPress(item);
      }
    },
    [cellSize, items, onPress],
  );

  const rowVisibility = useRowVisibility();

  return (
    <RowVisibilityContext.Provider value={rowVisibility}>
      <Pressable style={styles.emoteRow} onPress={handlePress}>
        {items.map(item => (
          <EmoteCell
            key={typeof item === 'string' ? `emoji-${item}` : item.id}
            cellSize={cellSize}
            item={item}
          />
        ))}
      </Pressable>
    </RowVisibilityContext.Provider>
  );
}

export const EmoteRow = memo(EmoteRowComponent);
