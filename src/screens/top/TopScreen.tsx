import { useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Stack } from 'expo-router';

import { StreamListLayoutMenu } from '@app/components/stream-list-layout-toggle/StreamListLayoutMenu';
import { TOP_TAB_ROUTES } from '@app/constants/top-tab-routes';
import { theme } from '@app/styles/themes';

import {
  TopScenesPager,
  type TopScenesPagerHandle,
} from './components/TopScenesPager';
import { TopSegmentedControl } from './components/TopSegmentedControl';

export function TopScreen() {
  const [index, setIndex] = useState<number>(0);
  const pagerRef = useRef<TopScenesPagerHandle>(null);
  const activeKey = TOP_TAB_ROUTES[index]?.key;

  const handleSegmentChange = (next: number) => {
    setIndex(next);
    pagerRef.current?.setPage(next);
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerTitleAlign: 'center',
          headerTitle: () => (
            <TopSegmentedControl
              index={index}
              onIndexChange={handleSegmentChange}
            />
          ),
        }}
      />
      <StreamListLayoutMenu hidden={activeKey !== 'streams'} />
      <TopScenesPager ref={pagerRef} index={index} onIndexChange={setIndex} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.color.background.dark,
    flex: 1,
  },
});
