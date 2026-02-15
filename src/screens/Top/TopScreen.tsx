import { Button } from '@app/components/Button/Button';
import { Text } from '@app/components/Text/Text';
import { useCallback, useState } from 'react';
import { useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TabView, type SceneRendererProps } from 'react-native-tab-view';
import { StyleSheet } from 'react-native-unistyles';
import { TopCategoriesScreen } from './TopCategoriesScreen';
import { TopStreamsScreen } from './TopStreamsScreen';

type Route = { key: string; title: string };

export function TopScreen() {
  const layout = useWindowDimensions();
  const [index, setIndex] = useState<number>(0);

  const [routes] = useState<Route[]>([
    { key: 'streams', title: 'Streams' },
    { key: 'categories', title: 'Categories' },
  ]);

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
          <View style={styles.tabContainer}>
            {props.navigationState.routes.map((route, i) => {
              return (
                <Button
                  key={route.key}
                  onPress={() => props.jumpTo(route.key)}
                  style={[styles.tab, styles.line(index, i)]}
                >
                  <Text>{route.title}</Text>
                </Button>
              );
            })}
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create(theme => ({
  container: {
    flex: 1,
    backgroundColor: theme.colors.gray.bg,
  },
  tabContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 15,
  },
  tab: {
    marginTop: 2,
    borderBottomWidth: 2.15,
    padding: 5,
    marginHorizontal: 10,
  },
  line: (index: number, currIndex: number) => ({
    borderBottomColor:
      index === currIndex ? theme.colors.plum.border : 'transparent',
    borderCurve: 'continuous',
  }),
  tabViewWrapper: {
    flex: 1,
  },
}));
