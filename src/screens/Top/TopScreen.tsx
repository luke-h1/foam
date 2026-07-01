import { useState } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import { type SceneRendererProps, TabView } from 'react-native-tab-view';

import { TOP_TAB_ROUTES } from '@app/constants/topTabRoutes';
import { theme } from '@app/styles/themes';

import { TopCategoriesScreen } from './TopCategoriesScreen';
import { TopSegmentControl } from './TopSegmentControl';
import { TopStreamsScreen } from './TopStreamsScreen';

type Route = { key: string; title: string };

const ROUTES: Route[] = [...TOP_TAB_ROUTES];

const renderScene = ({ route }: SceneRendererProps & { route: Route }) => {
  switch (route.key) {
    case 'streams':
      return <TopStreamsScreen />;
    case 'categories':
      return <TopCategoriesScreen />;
    default:
      return null;
  }
};

export function TopScreen() {
  const layout = useWindowDimensions();
  const [index, setIndex] = useState<number>(0);

  return (
    <View style={styles.container}>
      <View style={styles.segmentBar}>
        <TopSegmentControl index={index} onIndexChange={setIndex} />
      </View>
      <TabView
        lazy
        lazyPreloadDistance={1}
        animationEnabled={false}
        style={styles.tabViewWrapper}
        navigationState={{ index, routes: ROUTES }}
        renderScene={renderScene}
        onIndexChange={setIndex}
        initialLayout={{ width: layout.width }}
        renderTabBar={() => null}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.color.background.dark,
    flex: 1,
  },
  segmentBar: {
    backgroundColor: theme.color.background.dark,
    paddingHorizontal: theme.space20,
  },
  tabViewWrapper: {
    flex: 1,
  },
});
