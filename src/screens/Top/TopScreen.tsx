import { Button } from '@app/components/Button';
import { Text } from '@app/components/Text';
import { useState } from 'react';
import { useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TabView, SceneMap } from 'react-native-tab-view';
import { StyleSheet } from 'react-native-unistyles';
import { TopCategoriesScreen } from './TopCategoriesScreen';
import { TopStreamsScreen } from './TopStreamsScreen';

export function TopScreen() {
  const layout = useWindowDimensions();
  const [index, setIndex] = useState<number>(0);

  const [routes] = useState([
    { key: 'streams', title: 'Streams !!!' },
    { key: 'categories', title: 'Categories' },
  ]);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_, setCurrentTitle] = useState<string>('Streams');

  const renderScene = SceneMap({
    streams: TopStreamsScreen,
    categories: TopCategoriesScreen,
  });

  return (
    <SafeAreaView style={styles.container}>
      <TabView
        style={styles.tabViewWrapper}
        navigationState={{ index, routes }}
        renderScene={renderScene}
        onIndexChange={setIndex}
        initialLayout={{ width: layout.width }}
        renderTabBar={props => (
          <View style={styles.tabContainer}>
            {props.navigationState.routes.map(
              (route: { key: string; title: string }, i) => {
                return (
                  <Button
                    key={route.key}
                    onPress={() => {
                      props.jumpTo(route.key);
                      setCurrentTitle(route.title);
                    }}
                    style={[styles.tab, styles.line(index, i)]}
                  >
                    <Text>{route.title}</Text>
                  </Button>
                );
              },
            )}
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
