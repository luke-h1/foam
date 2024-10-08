import { useState } from 'react';
import {
  View,
  Text,
  useWindowDimensions,
  StyleSheet,
  ViewStyle,
  TextStyle,
  TouchableOpacity,
} from 'react-native';
import { TabView, SceneMap } from 'react-native-tab-view';
import TopCategoriesScreen from './TopCategoriesScreen';
import TopStreamsScreen from './TopStreamsScreen';
import SafeAreaContainer from '@app/components/SafeAreaContainer';

export default function TopScreen() {
  const layout = useWindowDimensions();
  const [index, setIndex] = useState<number>(0);

  const [routes] = useState([
    { key: 'streams', title: 'Streams' },
    { key: 'categories', title: 'Categories' },
  ]);

  const renderScene = SceneMap<keyof typeof routes>({
    streams: TopStreamsScreen,
    categories: TopCategoriesScreen,
  });

  return (
    <SafeAreaContainer>
      <TabView
        navigationState={{ index, routes }}
        renderScene={renderScene}
        onIndexChange={setIndex}
        initialLayout={{ width: layout.width, height: layout.height }}
        renderTabBar={({ navigationState, jumpTo }) => (
          <View style={styles.container}>
            {navigationState.routes.map((route, i) => (
              <TouchableOpacity
                key={route.key}
                onPress={() => jumpTo(route.key)}
                style={{
                  ...styles.title,
                  borderBottomColor: index === i ? 'purple' : 'transparent',
                }}
              >
                <Text>{route.title}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      />
    </SafeAreaContainer>
  );
}

const styles = StyleSheet.create<{
  container: ViewStyle;
  title: TextStyle;
}>({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  title: {
    marginTop: 5,
    borderBottomWidth: 1.95,
    padding: 10,
    marginHorizontal: 10,
  },
});
