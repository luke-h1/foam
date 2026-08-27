import { Activity, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { TOP_TAB_ROUTES } from '@app/constants/topTabRoutes';
import { theme } from '@app/styles/themes';

import { TopCategoriesScreen } from './TopCategoriesScreen';
import { TopSegmentControl } from './TopSegmentControl';
import { TopStreamsScreen } from './TopStreamsScreen';

export function TopScreen() {
  const [index, setIndex] = useState<number>(0);
  const activeKey = TOP_TAB_ROUTES[index]?.key;

  /**
   * Activity keeps both scenes mounted across segment flips (scroll/query state survive) while pausing the hidden scene's effects, so background refetches can't re-render a display:none FlashList at 0x0.
   */
  return (
    <View style={styles.container}>
      <View style={styles.segmentBar}>
        <TopSegmentControl index={index} onIndexChange={setIndex} />
      </View>
      <Activity mode={activeKey === 'streams' ? 'visible' : 'hidden'}>
        <View style={styles.scene}>
          <TopStreamsScreen />
        </View>
      </Activity>
      <Activity mode={activeKey === 'categories' ? 'visible' : 'hidden'}>
        <View style={styles.scene}>
          <TopCategoriesScreen />
        </View>
      </Activity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.color.background.dark,
    flex: 1,
  },
  scene: {
    flex: 1,
  },
  segmentBar: {
    backgroundColor: theme.color.background.dark,
    paddingHorizontal: theme.space16,
  },
});
