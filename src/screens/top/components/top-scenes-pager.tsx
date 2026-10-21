import { Activity, type Ref, useImperativeHandle } from 'react';
import { StyleSheet, View } from 'react-native';

import { TOP_TAB_ROUTES } from '@app/constants/top-tab-routes';

import { TopCategoriesScreen } from '../top-categories-screen';
import { TopStreamsScreen } from '../top-streams-screen';

export interface TopScenesPagerHandle {
  setPage: (index: number) => void;
}

interface TopScenesPagerProps {
  index: number;
  onIndexChange: (index: number) => void;
  ref?: Ref<TopScenesPagerHandle>;
}

export function TopScenesPager({
  index,
  onIndexChange: _onIndexChange,
  ref,
}: TopScenesPagerProps) {
  const activeKey = TOP_TAB_ROUTES[index]?.key;

  useImperativeHandle(ref, () => ({
    setPage: () => undefined,
  }));

  return (
    <View style={styles.container}>
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
    flex: 1,
  },
  scene: {
    flex: 1,
  },
});
