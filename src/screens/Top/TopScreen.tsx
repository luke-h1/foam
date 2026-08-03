import { useState } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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
    <SafeAreaView edges={['top']} style={styles.container}>
      <View style={styles.segmentBar}>
        <TopSegmentControl index={index} onIndexChange={setIndex} />
      </View>
      <TabView
        lazy
        lazyPreloadDistance={1}
        style={styles.tabViewWrapper}
        navigationState={{ index, routes: ROUTES }}
        renderScene={renderScene}
        onIndexChange={setIndex}
        initialLayout={{ width: layout.width }}
        renderTabBar={() => null}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.color.background.dark,
    flex: 1,
  },
  segmentBar: {
    backgroundColor: theme.color.background.dark,
    paddingHorizontal: theme.space16,
  },
  tabViewWrapper: {
    flex: 1,
  },
});
