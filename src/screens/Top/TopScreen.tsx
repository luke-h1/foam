import { useState } from 'react';
import {
  Text,
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
  const [index, setIndex] = useState(0);

  const [routes] = useState([
    { key: 'streams', title: 'Streams' },
    { key: 'categories', title: 'Categories' },
  ]);

  const renderScene = SceneMap<keyof typeof routes>({
    streams: TopStreamsScreen,
    categories: TopCategoriesScreen,
  });

  return (
    <TabView
      navigationState={{ index, routes }}
      renderScene={renderScene}
      onIndexChange={setIndex}
      initialLayout={{ width: layout.width, height: layout.height }}
      renderTabBar={props => (
        <View style={styles.tabBarContainer}>
          {props.navigationState.routes.map((route, i) => (
            <TouchableOpacity
              key={route.key}
              onPress={() => props.jumpTo(route.key)}
              style={[
                styles.tab,
                { borderBottomColor: index === i ? 'purple' : 'transparent' },
              ]}
            >
              <Text>{route.title}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  tabBarContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingHorizontal: 5,
    paddingVertical: 15,
  },
  tab: {
    marginTop: 2,
    borderBottomWidth: 2.15,
    padding: 4,
    marginHorizontal: 10,
  },
});
