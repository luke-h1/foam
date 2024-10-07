/* eslint-disable react/no-unstable-nested-components */
import { useAuthContext } from '@app/context/AuthContext';
import theme from '@app/styles/theme';
import { Text } from 'react-native';
import Icon from 'react-native-vector-icons/AntDesign';
import FollowingNavigator from './Following/FollowingNavigator';
import { HomeTabs, HomeTabsRoutes } from './HomeTabs';
import TopNavigator from './Top/TopNavigator';
import TabBarLabel from '@app/components/TabBarLabel';

export default function HomeTabsNavigator() {
  const { auth } = useAuthContext();

  return (
    <HomeTabs.Navigator
      screenOptions={{
        tabBarActiveTintColor: theme.color.white,
        tabBarInactiveTintColor: '#d9d9d9',
        tabBarStyle: {
          borderTopColor: '#66666666',
          backgroundColor: 'transparent',
          elevation: 0,
        },
      }}
      initialRouteName={
        auth && auth.token
          ? HomeTabsRoutes.FollowingStack
          : HomeTabsRoutes.TopStack
      }
    >
      {auth?.isAuth && (
        <HomeTabs.Screen
          name={HomeTabsRoutes.FollowingStack}
          component={FollowingNavigator}
        />
      )}

      <HomeTabs.Screen
        name={HomeTabsRoutes.TopStack}
        component={TopNavigator}
        options={{
          // eslint-disable-next-line react/no-unstable-nested-components
          tabBarIcon: () => <Icon size={24} name="user" />,

          // eslint-disable-next-line react/no-unstable-nested-components
          tabBarLabel: () => <TabBarLabel>Top</TabBarLabel>,
        }}
      />
    </HomeTabs.Navigator>
  );
}
