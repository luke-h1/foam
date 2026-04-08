import { Button } from '@app/components/Button/Button';
import { Text } from '@app/components/Text/Text';
import { theme } from '@app/styles/themes';
import { useCallback, useState } from 'react';
import { Platform, useWindowDimensions, View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TabView, type SceneRendererProps } from 'react-native-tab-view';
import { TopCategoriesScreen } from './TopCategoriesScreen';
import { TopStreamsScreen } from './TopStreamsScreen';

type Route = { key: string; title: string };

const ROUTES: Route[] = [
  { key: 'streams', title: 'Streams' },
  { key: 'categories', title: 'Categories' },
];

function TabBar({
  index,
  onTabPress,
}: {
  index: number;
  onTabPress: (i: number) => void;
}) {
  return (
    <View style={styles.tabContainer}>
      {ROUTES.map((route, i) => (
        <View
          key={route.key}
          style={[styles.tab, index === i && styles.activeLine]}
        >
          <Button onPress={() => onTabPress(i)}>
            <Text>{route.title}</Text>
          </Button>
        </View>
      ))}
    </View>
  );
}

export function TopScreen() {
  const layout = useWindowDimensions();
  const [index, setIndex] = useState<number>(0);

  const [routes] = useState<Route[]>(ROUTES);

  const renderScene = useCallback(
    // eslint-disable-next-line react/no-unused-prop-types
    ({ route }: SceneRendererProps & { route: Route }) => {
      switch (route.key) {
        case 'streams':
          return <TopStreamsScreen />;
        case 'categories':
          return <TopCategoriesScreen />;
        default:
          return null;
      }
    },
    [],
  );

  if (Platform.OS === 'android') {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <TabBar index={index} onTabPress={setIndex} />
        <View style={styles.sceneContainer}>
          {index === 0 ? <TopStreamsScreen /> : <TopCategoriesScreen />}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <TabView
        lazy
        style={styles.tabViewWrapper}
        navigationState={{ index, routes }}
        renderScene={renderScene}
        onIndexChange={setIndex}
        initialLayout={{ width: layout.width }}
        renderTabBar={props => (
          <TabBar
            index={index}
            onTabPress={i => {
              const route = ROUTES[i];
              if (route) props.jumpTo(route.key);
            }}
          />
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  activeLine: {
    borderBottomColor: theme.colors.plum.border,
  },
  container: {
    backgroundColor: theme.colors.gray.bg,
    flex: 1,
  },
  sceneContainer: {
    flex: 1,
  },
  tab: {
    borderBottomWidth: 2.15,
    marginHorizontal: 10,
    marginTop: 2,
    padding: 5,
  },
  tabContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 15,
  },
  tabViewWrapper: {
    flex: 1,
  },
});
