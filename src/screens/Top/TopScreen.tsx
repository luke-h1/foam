import { ScrollAdaptiveHeader } from '@app/components/ScrollAdaptiveHeader/ScrollAdaptiveHeader';
import { TopTabSwitcher } from '@app/components/TopTabSwitcher/TopTabSwitcher';
import { Text } from '@app/components/Text/Text';
import { theme } from '@app/styles/themes';
import { useCallback, useState } from 'react';
import { useWindowDimensions, View, StyleSheet } from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { TabView, type SceneRendererProps } from 'react-native-tab-view';
import { TopCategoriesScreen } from './TopCategoriesScreen';
import { TopStreamsScreen } from './TopStreamsScreen';

type Route = { key: string; title: string };

const TOP_COPY_HEIGHT = 164;
const TOP_TAB_HEIGHT = 58;

const ROUTES: Route[] = [
  { key: 'streams', title: 'Streams' },
  { key: 'categories', title: 'Categories' },
];

export function TopScreen() {
  const layout = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [index, setIndex] = useState<number>(0);
  const scrollY = useSharedValue(0);
  const contentTopInset =
    TOP_COPY_HEIGHT + TOP_TAB_HEIGHT + theme.space12 + theme.space8;

  const heroStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [0, 72], [1, 0], Extrapolation.CLAMP),
    transform: [
      {
        translateY: interpolate(
          scrollY.value,
          [0, 96],
          [0, -36],
          Extrapolation.CLAMP,
        ),
      },
    ],
  }));

  const tabsStyle = useAnimatedStyle(() => ({
    top: interpolate(
      scrollY.value,
      [0, 96],
      [TOP_COPY_HEIGHT + theme.space8, theme.space8],
      Extrapolation.CLAMP,
    ),
  }));

  const renderScene = useCallback(
    // eslint-disable-next-line react/no-unused-prop-types
    ({ route }: SceneRendererProps & { route: Route }) => {
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
    },
    [contentTopInset, scrollY],
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollAdaptiveHeader
        scrollY={scrollY}
        subtitle="Live rankings"
        topInset={insets.top}
        title="Top"
      />
      <View
        pointerEvents="box-none"
        style={[
          styles.headerOverlay,
          { height: contentTopInset, top: insets.top },
        ]}
      >
        <Animated.View style={[styles.hero, heroStyle]}>
          <Text
            type="xs"
            weight="semibold"
            color="gray.textLow"
            style={styles.eyebrow}
          >
            LIVE RANKINGS
          </Text>
          <Text type="5xl" variant="display" style={styles.title}>
            Top
          </Text>
        </Animated.View>
        <Animated.View style={[styles.tabsFrame, tabsStyle]}>
          <TopTabSwitcher
            currentIndex={index}
            items={ROUTES.map(route => route.title)}
            onChange={setIndex}
          />
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.color.background.dark,
    flex: 1,
  },
  eyebrow: {
    letterSpacing: 1,
    marginBottom: theme.space8,
  },
  headerOverlay: {
    left: 0,
    paddingHorizontal: theme.space20,
    position: 'absolute',
    right: 0,
    top: 0,
    zIndex: 10,
  },
  hero: {
    gap: theme.space8,
    minHeight: TOP_COPY_HEIGHT,
    paddingTop: theme.space12,
  },
  tabViewWrapper: {
    flex: 1,
  },
  tabsFrame: {
    left: theme.space20,
    position: 'absolute',
    right: theme.space20,
  },
  title: {
    lineHeight: 44,
  },
});
