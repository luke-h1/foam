import { useState } from 'react';
import { StyleSheet,useWindowDimensions, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';
import { type SceneRendererProps,TabView } from 'react-native-tab-view';

import { TOP_TAB_ROUTES } from '@app/constants/topTabRoutes';
import { theme } from '@app/styles/themes';

import { TopCategoriesScreen } from './TopCategoriesScreen';
import { TopSegmentControl } from './TopSegmentControl';
import { TopStreamsScreen } from './TopStreamsScreen';

type Route = { key: string; title: string };

const ROUTES: Route[] = [...TOP_TAB_ROUTES];

const TOP_SEGMENT_HEIGHT = 44;
const contentTopInset = TOP_SEGMENT_HEIGHT + theme.space12 + theme.space8;

export function TopScreen() {
  const layout = useWindowDimensions();
  const [index, setIndex] = useState<number>(0);
  const scrollY = useSharedValue(0);

  const segmentStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: -scrollY.get() }],
  }));

  const renderScene = ({ route }: SceneRendererProps & { route: Route }) => {
    switch (route.key) {
      case 'streams':
        return (
          <TopStreamsScreen
            contentTopInset={contentTopInset}
            scrollY={scrollY}
          />
        );
      case 'categories':
        return (
          <TopCategoriesScreen
            contentTopInset={contentTopInset}
            scrollY={scrollY}
          />
        );
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      <View pointerEvents='box-none' style={styles.headerOverlay}>
        <Animated.View style={[styles.segmentFrame, segmentStyle]}>
          <TopSegmentControl index={index} onIndexChange={setIndex} />
        </Animated.View>
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
  headerOverlay: {
    left: 0,
    paddingHorizontal: theme.space20,
    position: 'absolute',
    right: 0,
    top: 0,
    zIndex: 10,
  },
  segmentFrame: {
    backgroundColor: theme.color.background.dark,
    paddingBottom: theme.space8,
    paddingTop: theme.space12,
  },
  tabViewWrapper: {
    flex: 1,
  },
});
