import { memo } from 'react';
import { View } from 'react-native';

import type { TabToolbarProps } from '../types';
import { layoutStyles as styles } from '../utils/layout-styles';
import { MorphTab } from './morph-tab';

const TabToolbar = memo(function TabToolbar({
  activeKey,
  colors,
  items,
  onPress,
}: TabToolbarProps) {
  return (
    <View style={styles.toolbarRow}>
      {items.map((item, index) => (
        <MorphTab
          key={item.key}
          active={activeKey === item.key}
          colors={colors}
          index={index}
          item={item}
          onPress={onPress}
        />
      ))}
    </View>
  );
});

export { TabToolbar };
