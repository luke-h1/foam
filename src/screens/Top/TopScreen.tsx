import { useState } from 'react';
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
   * Both screens stay mounted (as under TabView): a segment flip must not drop
   * scroll state or re-fire useRefetchOnForeground's mount-time refetch.
   */
  return (
    <View style={styles.container}>
      <View style={styles.segmentBar}>
        <TopSegmentControl index={index} onIndexChange={setIndex} />
      </View>
      <View style={activeKey === 'streams' ? styles.scene : styles.hiddenScene}>
        <TopStreamsScreen />
      </View>
      <View
        style={activeKey === 'categories' ? styles.scene : styles.hiddenScene}
      >
        <TopCategoriesScreen />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.color.background.dark,
    flex: 1,
  },
  hiddenScene: {
    display: 'none',
  },
  scene: {
    flex: 1,
  },
  segmentBar: {
    backgroundColor: theme.color.background.dark,
    paddingHorizontal: theme.space16,
  },
});
