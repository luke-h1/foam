import { Typography } from '@app/components/Typography';
import { useState } from 'react';
import { View, useWindowDimensions } from 'react-native';
import { TabView, SceneMap, TabBar } from 'react-native-tab-view';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import TopCategoriesScreen from './top-categories';
import TopStreamsScreen from './top-streams';

const renderScene = SceneMap({
  streams: TopStreamsScreen,
  categories: TopCategoriesScreen,
});

export default function TopScreen() {
  const layout = useWindowDimensions();
  const { theme } = useUnistyles();

  const [index, setIndex] = useState(0);
  const [routes] = useState([
    { key: 'streams', title: 'Streams' },
    { key: 'categories', title: 'Categories' },
  ]);

  const renderTabBar = props => (
    <View style={styles.tabBarContainer}>
      <TabBar
        {...props}
        indicatorStyle={[
          styles.indicator,
          { backgroundColor: theme.colors.accent.accent },
        ]}
        style={[styles.tabBar, { backgroundColor: theme.colors.gray.bgAlpha }]}
        tabStyle={styles.tab}
        renderLabel={({ route, focused }) => (
          <Typography
            fontWeight={focused ? 'bold' : 'regular'}
            style={[
              styles.tabLabel,
              {
                color: focused
                  ? theme.colors.accent.accent
                  : theme.colors.gray.accent,
              },
            ]}
          >
            {route.title}
          </Typography>
        )}
      />
    </View>
  );

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <TabView
        navigationState={{ index, routes }}
        renderScene={renderScene}
        onIndexChange={setIndex}
        initialLayout={{ width: layout.width }}
        renderTabBar={renderTabBar}
      />
    </View>
  );
}

const styles = StyleSheet.create(theme => ({
  container: {
    flex: 1,
  },
  tabBarContainer: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
  },
  tabBar: {
    borderRadius: theme.radii.xl,
    shadowColor: theme.colors.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  tab: {
    paddingVertical: theme.spacing.md,
  },
  indicator: {
    height: 3,
    borderRadius: theme.radii.sm,
    marginBottom: theme.spacing.xs,
  },
  tabLabel: {
    fontSize: 16,
    textAlign: 'center',
  },
}));
