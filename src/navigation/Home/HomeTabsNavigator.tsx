/* eslint-disable react/no-unstable-nested-components */
import TabBarLabel from '@app/components/TabBarLabel';
import { useAuthContext } from '@app/context/AuthContext';
import theme from '@app/styles/theme';
import Icon from 'react-native-vector-icons/AntDesign';
import FollowingNavigator from './Following/FollowingNavigator';
import { HomeTabs, HomeTabsRoutes } from './HomeTabs';
import TopNavigator from './Top/TopNavigator';

export default function HomeTabsNavigator() {
  const { auth } = useAuthContext();

  return (
    <HomeTabs.Navigator
      screenOptions={{
        headerTitleAlign: 'left',
        // headerShown: false,
        tabBarActiveTintColor: 'purple',
        tabBarStyle: {
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          marginTop: -20,
          paddingHorizontal: 20,
          height: 75,
        },
        tabBarItemStyle: {
          justifyContent: 'center',
          paddingVertical: 1,
          paddingHorizontal: 4,
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
