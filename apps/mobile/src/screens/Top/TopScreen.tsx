import { useState } from 'react';
import { TouchableOpacity, useWindowDimensions } from 'react-native';
import { TabView, SceneMap } from 'react-native-tab-view';
import { Stack, Text } from 'tamagui';
import TopCategoriesScreen from './Categories';
import TopStreamsScreen from './Streams';

const TopScreen = () => {
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
        <Stack flexDirection="row" paddingHorizontal={5}>
          {props.navigationState.routes.map((route, i) => (
            <TouchableOpacity
              key={route.key}
              onPress={() => props.jumpTo(route.key)}
              style={{
                marginTop: 5,
                borderBottomWidth: 1.95,
                padding: 6,
                borderBottomColor: index === i ? 'purple' : 'transparent',
              }}
            >
              <Text color="$color" fontWeight="bold">
                {route.title}
              </Text>
            </TouchableOpacity>
          ))}
        </Stack>
      )}
    />
  );
};
export default TopScreen;
