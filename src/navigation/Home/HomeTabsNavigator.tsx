/* eslint-disable react/no-unstable-nested-components */
import Header from '@app/components/Header';
import { useAuthContext } from '@app/context/AuthContext';
import FollowingScreen from '@app/screens/FollowingScreen';
import SearchScreen from '@app/screens/SearchScreen';
import TopScreen from '@app/screens/Top/TopScreen';
import { BottomTabHeaderProps } from '@react-navigation/bottom-tabs';
import Feather from 'react-native-vector-icons/Feather';
import { HomeTabs, HomeTabsRoutes } from './HomeTabs';

const HomeTabsNavigator = () => {
  const { auth } = useAuthContext();
  return (
    <HomeTabs.Navigator
      initialRouteName={
        auth?.token ? HomeTabsRoutes.Following : HomeTabsRoutes.Top
      }
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
    >
      {auth?.isAuth && (
        <HomeTabs.Screen
          name={HomeTabsRoutes.Following}
          component={FollowingScreen}
          options={{
            tabBarIcon: () => <Feather size={24} color="red" name="heart" />,
            header(props: BottomTabHeaderProps) {
              return <Header {...props} title="Following" />;
            },
          }}
        />
      )}

      <HomeTabs.Screen
        name={HomeTabsRoutes.Top}
        component={TopScreen}
        options={{
          headerStyle: {
            // backgroundColor: colors.black,
          },
          tabBarIcon: () => <Feather size={20} name="arrow-up" />,
          header(props: BottomTabHeaderProps) {
            return <Header {...props} title="Top" />;
          },
        }}
      />
      <HomeTabs.Screen
        name={HomeTabsRoutes.Search}
        component={SearchScreen}
        options={{
          tabBarIcon: () => <Feather size={20} name="search" />,
          header(props: BottomTabHeaderProps) {
            return <Header {...props} title="Search" />;
          },
        }}
      />
    </HomeTabs.Navigator>
  );
};

export default HomeTabsNavigator;
