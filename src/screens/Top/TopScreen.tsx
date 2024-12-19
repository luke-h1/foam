import Screen from '@app/components/ui/Screen';
import { Text } from '@app/components/ui/Text';
import useHeader from '@app/hooks/useHeader';
import { useState } from 'react';
import {
  TouchableOpacity,
  useWindowDimensions,
  View,
  StyleSheet,
} from 'react-native';
import { TabView, SceneMap } from 'react-native-tab-view';
import TopCategoriesScreen from './Categories';
import TopStreamsScreen from './Streams';

export default function TopScreen() {
  const layout = useWindowDimensions();
  const [index, setIndex] = useState<number>(0);

  const [routes] = useState([
    { key: 'streams', title: 'Streams' },
    { key: 'categories', title: 'Categories' },
  ]);
  const [currentTitle, setCurrentTitle] = useState<string>('Streams');

  useHeader(
    {
      title: currentTitle,
    },
    [currentTitle],
  );

  const renderScene = SceneMap<keyof typeof routes>({
    streams: TopStreamsScreen,
    categories: TopCategoriesScreen,
  });

  return (
    <Screen safeAreaEdges={['top', 'bottom', 'left', 'right']} preset="scroll">
      <TabView
        navigationState={{ index, routes }}
        renderScene={renderScene}
        onIndexChange={setIndex}
        initialLayout={{ width: layout.width, height: layout.height }}
        renderTabBar={props => (
          <View style={styles.tabBarContainer}>
            {props.navigationState.routes.map((route, i) => {
              return (
                <TouchableOpacity
                  key={route.key}
                  onPress={() => {
                    props.jumpTo(route.key);
                    setCurrentTitle(route.title);
                  }}
                  style={[
                    styles.tab,
                    {
                      borderBottomColor: index === i ? 'purple' : 'transparent',
                    },
                  ]}
                >
                  <Text preset="tag">{route.title}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  tabBarContainer: {
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
});
