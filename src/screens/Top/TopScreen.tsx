import { useState } from 'react';
import {
  StyleSheet,
  useColorScheme,
  useWindowDimensions,
  View,
} from 'react-native';
import { type SceneRendererProps, TabView } from 'react-native-tab-view';

import { TOP_TAB_ROUTES } from '@app/constants/topTabRoutes';
import { theme } from '@app/styles/themes';

import { TopSegmentControl } from './components/TopSegmentControl';
import { TopCategoriesScreen } from './TopCategoriesScreen';
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
  const colorScheme = useColorScheme();
  const scheme = colorScheme === 'light' ? 'light' : 'dark';
  const [index, setIndex] = useState<number>(0);

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: theme.color.background[scheme] },
      ]}
    >
      <View
        style={[
          styles.segmentBar,
          { backgroundColor: theme.color.background[scheme] },
        ]}
      >
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
    flex: 1,
  },
  segmentBar: {
    paddingHorizontal: theme.space16,
  },
  tabViewWrapper: {
    flex: 1,
  },
});
