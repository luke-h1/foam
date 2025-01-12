import { Text } from '@app/components/ui/Text';
import { useAuthContext } from '@app/context/AuthContext';
import useAppNavigation from '@app/hooks/useAppNavigation';
import useHeader from '@app/hooks/useHeader';
import BackButton from '@app/navigators/BackButton';
import React, { useState } from 'react';
import {
  useWindowDimensions,
  View,
  TouchableOpacity,
  ViewStyle,
} from 'react-native';
import { TabView, SceneMap } from 'react-native-tab-view';
import TopCategoriesScreen from './TopCategoriesScreen';
import TopStreamsScreen from './TopStreamsScreen';

export default function TopScreen() {
  const layout = useWindowDimensions();
  const [index, setIndex] = useState<number>(0);

  const { user } = useAuthContext();

  const [routes] = useState([
    { key: 'streams', title: 'Streams' },
    { key: 'categories', title: 'Categories' },
  ]);
  const [currentTitle, setCurrentTitle] = useState<string>('Streams');

  useHeader(
    {
      title: currentTitle,
      LeftActionComponent: user ? <BackButton /> : undefined,
    },
    [currentTitle],
  );

  const renderScene = SceneMap({
    streams: TopStreamsScreen,
    categories: TopCategoriesScreen,
  });

  return (
    <TabView
      navigationState={{ index, routes }}
      renderScene={renderScene}
      onIndexChange={setIndex}
      initialLayout={{ width: layout.width }}
      renderTabBar={props => (
        <View style={$tabBarContainer}>
          {props.navigationState.routes.map((route, i) => {
            return (
              <TouchableOpacity
                key={route.key}
                onPress={() => {
                  props.jumpTo(route.key);
                  setCurrentTitle(route.title);
                }}
                style={[
                  $tab,
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
  );
}

const $tabBarContainer: ViewStyle = {
  flexDirection: 'row',
  justifyContent: 'center',
  paddingHorizontal: 12,
  paddingVertical: 15,
};

const $tab: ViewStyle = {
  marginTop: 2,
  borderBottomWidth: 2.15,
  padding: 5,
  marginHorizontal: 10,
};
