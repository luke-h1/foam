/* eslint-disable react/no-unstable-nested-components */
import { BottomTabHeaderProps } from '@react-navigation/bottom-tabs';
import { Search, Heart, ArrowUpFromLine } from '@tamagui/lucide-icons';
import Header from '../../components/Header';
import { useAuthContext } from '../../context/AuthContext';
import FollowingScreen from '../../screens/FollowingScreen';
import SearchScreen from '../../screens/SearchScreen';
import TopScreen from '../../screens/Top/TopScreen';
import { colors } from '../../styles';
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
            tabBarIcon: () => <Heart size={24} color={colors.gray500} />,
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
            <ArrowUpFromLine size={20} color={colors.gray500} />
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
          tabBarIcon: () => <Search size={20} color={colors.gray500} />,
          header(props: BottomTabHeaderProps) {
            return <Header {...props} title="Search" />;
          },
        }}
      />
    </HomeTabs.Navigator>
  );
};

export default HomeTabsNavigator;
