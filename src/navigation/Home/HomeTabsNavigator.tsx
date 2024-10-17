/* eslint-disable react/no-unstable-nested-components */
import { useAuthContext } from '@app/context/AuthContext';
import FollowingScreen from '@app/screens/FollowingScreen';
import Feather from 'react-native-vector-icons/Feather';
import { HomeTabs, HomeTabsRoutes } from './HomeTabs';
import SearchStackNavigator from './Search/SearchStackNavigator';
import TopStackNavigator from './Top/TopStackNavigator';

export default function HomeTabsNavigator() {
  const { auth } = useAuthContext();
  return (
    <HomeTabs.Navigator
      initialRouteName={
        auth?.token ? HomeTabsRoutes.Following : HomeTabsRoutes.Top
      }
      screenOptions={{
        headerTitleAlign: 'left',
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
    >
      {auth?.isAuth && (
        <HomeTabs.Screen
          name={HomeTabsRoutes.Following}
          component={FollowingScreen}
          options={{
            tabBarIcon: () => <Feather size={24} color="black" name="heart" />,
          }}
        />
      )}

      <HomeTabs.Screen
        name={HomeTabsRoutes.Top}
        component={TopStackNavigator}
        options={{
          tabBarIcon: () => <Feather size={20} name="arrow-up" />,
        }}
      />

      <HomeTabs.Screen
        name={HomeTabsRoutes.Search}
        component={SearchStackNavigator}
        options={{
          tabBarIcon: () => <Feather size={20} name="search" />,
        }}
      />

      {/* <HomeTabs.Screen
        name={HomeTabsRoutes.Account}
        component={AccountStackNavigator}
        options={{
          tabBarIcon: () => <Feather size={20} name="user" />,
        }}
      /> */}
    </HomeTabs.Navigator>
  );
}
