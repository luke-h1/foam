import { memo } from 'react';
import { View } from 'react-native';

import { EmoteCell } from './EmoteCell';
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
  return (
    <View style={styles.emoteRow}>
      {items.map((item, index) => (
        <EmoteCell
          key={typeof item === 'string' ? `emoji-${index}-${item}` : item.id}
          cellSize={cellSize}
          item={item}
          onPress={onPress}
        />
      ))}
    </View>
  );
}

export const EmoteRow = memo(EmoteRowComponent);
