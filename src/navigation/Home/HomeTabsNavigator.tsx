import { Entypo } from '@expo/vector-icons';
import React from 'react';
import { Text, View } from 'react-native';
import BrowseScreen from '../../screens/BrowseScreen';
import FollowingScreen from '../../screens/FollowingScreen';
import SearchScreen from '../../screens/SearchScreen';
import TopScreen from '../../screens/TopScreen';
import { RootRoutes, RootStackScreenProps } from '../RootStack';
import { HomeTabs, HomeTabsRoutes } from './HomeTabs';

const HomeTabsNavigator = ({
  navigation,
}: RootStackScreenProps<RootRoutes.Home>) => {
  return (
    <HomeTabs.Navigator
      initialRouteName={HomeTabsRoutes.Following}
      screenOptions={{
        headerTitleAlign: 'left',
        // headerShown: false,
        // eslint-disable-next-line react/no-unstable-nested-components
        headerRight: () => (
          <View>
            <Text>
              <Entypo
                name="cog"
                size={24}
                color="black"
                onPress={() => {
                  navigation.navigate(RootRoutes.SettingsModal);
                }}
              />
            </Text>
          </View>
        ),
      }}
    >
      <HomeTabs.Screen
        name={HomeTabsRoutes.Following}
        component={FollowingScreen}
      />
      <HomeTabs.Screen name={HomeTabsRoutes.Top} component={TopScreen} />
      <HomeTabs.Screen name={HomeTabsRoutes.Browse} component={BrowseScreen} />
      <HomeTabs.Screen name={HomeTabsRoutes.Search} component={SearchScreen} />
    </HomeTabs.Navigator>
  );
};

export default HomeTabsNavigator;
