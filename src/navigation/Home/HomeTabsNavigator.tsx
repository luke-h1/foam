/* eslint-disable react/no-unstable-nested-components */
import TabBarLabel from '@app/components/TabBarLabel';
import { useAuthContext } from '@app/context/AuthContext';
import Icon from 'react-native-vector-icons/AntDesign';
import FollowingNavigator from './Following/FollowingNavigator';
import { HomeTabs, HomeTabsRoutes } from './HomeTabs';
import TopNavigator from './Top/TopNavigator';

export default function HomeTabsNavigator() {
  const { auth } = useAuthContext();

  return (
    <HomeTabs.Navigator
      screenOptions={{
        // headerShown: false,
        tabBarActiveTintColor: 'purple',
      }}
      initialRouteName={
        auth?.token ? HomeTabsRoutes.FollowingStack : HomeTabsRoutes.TopStack
      }
    >
      {auth?.token ? (
        <HomeTabs.Screen
          name={HomeTabsRoutes.FollowingStack}
          component={FollowingNavigator}
        />
      ) : null}

      <HomeTabs.Screen
        name={HomeTabsRoutes.TopStack}
        component={TopNavigator}
        options={{
          headerShown: false,
          // eslint-disable-next-line react/no-unstable-nested-components
          tabBarIcon: () => <Icon size={24} name="user" />,

          // eslint-disable-next-line react/no-unstable-nested-components
          tabBarLabel: () => <TabBarLabel>Top</TabBarLabel>,
        }}
      />
    </HomeTabs.Navigator>
  );
}
