/* eslint-disable react/no-unstable-nested-components */
import { useAuthContext } from '@app/context/AuthContext';
import FollowingScreen from '@app/screens/home/FollowingScreen';
import TopScreen from '@app/screens/home/Top/TopScreen';
import Icon from 'react-native-vector-icons/Feather';
import { HomeTabs, HomeTabsRoutes } from './HomeTabs';

export default function HomeTabsNavigator() {
  const { auth } = useAuthContext();

  return (
    <HomeTabs.Navigator
      screenOptions={{
        // headerShown: false,
        tabBarActiveTintColor: 'purple',
      }}
      initialRouteName={
        auth?.isAuth ? HomeTabsRoutes.Following : HomeTabsRoutes.Top
      }
    >
      {auth?.isAuth ? (
        <HomeTabs.Screen
          name={HomeTabsRoutes.Following}
          component={FollowingScreen}
          options={{
            tabBarIcon: () => <Icon size={24} color="red" name="heart" />,
          }}
        />
      ) : null}

      <HomeTabs.Screen
        name={HomeTabsRoutes.Top}
        component={TopScreen}
        options={{
          headerStyle: {
            // backgroundColor: colors.black,
          },
          tabBarIcon: () => <Icon size={20} name="arrow-up" />,
        }}
      />
    </HomeTabs.Navigator>
  );
}
