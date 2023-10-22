import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationProp } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import BrowseScreen from '../../screens/BrowseScreen';
import FollowingScreen from '../../screens/FollowingScreen';
import SearchScreen from '../../screens/SearchScreen';
import TopScreen from '../../screens/TopScreen';

export type HomeStackTabParamList = {
  Following?: undefined;
  Browse: undefined;
  Search: undefined;
  Top: undefined;
};

export type TopNavigationProps = NativeStackScreenProps<
  HomeStackTabParamList,
  'Top'
>;

export type FollowingNavigationProps = NativeStackScreenProps<
  HomeStackTabParamList,
  'Following'
>;
export type BrowseNavigationProps = NativeStackScreenProps<
  HomeStackTabParamList,
  'Browse'
>;
export type SearchNavigationProps = NativeStackScreenProps<
  HomeStackTabParamList,
  'Search'
>;

export type HomeStackNavigation = NavigationProp<HomeStackTabParamList>;

const Tabs = createBottomTabNavigator<HomeStackTabParamList>();

const HomeTabNavigator = () => {
  const isLoggedIn = true;
  return (
    <Tabs.Navigator>
      <Tabs.Group>
        {isLoggedIn ? (
          <>
            <Tabs.Screen
              name="Following"
              component={FollowingScreen}
              options={{
                headerShown: false,
              }}
            />
            <Tabs.Screen
              name="Top"
              component={TopScreen}
              options={{
                headerShown: false,
              }}
            />
          </>
        ) : (
          <Tabs.Screen
            name="Top"
            component={TopScreen}
            options={{
              headerShown: false,
            }}
          />
        )}
        <Tabs.Screen
          name="Browse"
          component={BrowseScreen}
          options={{
            headerShown: false,
          }}
        />
        <Tabs.Screen
          name="Search"
          component={SearchScreen}
          options={{
            headerShown: false,
          }}
        />
      </Tabs.Group>
    </Tabs.Navigator>
  );
};
export default HomeTabNavigator;
