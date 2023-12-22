/* eslint-disable react/no-unstable-nested-components */
import { AntDesign, Feather } from '@expo/vector-icons';
import { BottomTabHeaderProps } from '@react-navigation/bottom-tabs';
import Header from '../../components/Header';
import { useAuthContext } from '../../context/AuthContext';
import FollowingScreen from '../../screens/FollowingScreen';
import SearchScreen from '../../screens/SearchScreen';
import TopScreen from '../../screens/TopScreen';
import colors from '../../styles/colors';
import { HomeTabs, HomeTabsRoutes } from './HomeTabs';

const HomeTabsNavigator = () => {
  const { auth } = useAuthContext();
  return (
    <HomeTabs.Navigator
      initialRouteName={
        auth?.isAuth ? HomeTabsRoutes.Following : HomeTabsRoutes.Top
      }
      screenOptions={{
        headerTitleAlign: 'left',
        // headerShown: false,
        tabBarActiveTintColor: colors.purple,
        tabBarStyle: {
          backgroundColor: colors.primary,
        },
        headerStyle: {
          backgroundColor: colors.black,
        },
      }}
    >
      {auth?.isAuth && (
        <HomeTabs.Screen
          name={HomeTabsRoutes.Following}
          component={FollowingScreen}
          options={{
            tabBarIcon: () => (
              <Feather name="heart" size={24} color={colors.gray} />
            ),
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
            backgroundColor: colors.black,
          },
          tabBarIcon: () => (
            <AntDesign name="totop" size={24} color={colors.gray} />
          ),
          header(props: BottomTabHeaderProps) {
            return <Header {...props} title="Top" />;
          },
        }}
      />
      <HomeTabs.Screen
        name={HomeTabsRoutes.Search}
        component={SearchScreen}
        options={{
          tabBarIcon: () => (
            <Feather name="search" size={24} color={colors.gray} />
          ),
          header(props: BottomTabHeaderProps) {
            return <Header {...props} title="Search" />;
          },
        }}
      />
    </HomeTabs.Navigator>
  );
};

export default HomeTabsNavigator;
