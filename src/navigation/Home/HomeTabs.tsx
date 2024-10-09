import {
  BottomTabScreenProps,
  createBottomTabNavigator,
} from '@react-navigation/bottom-tabs';
import {
  NavigationProp,
  NavigatorScreenParams,
} from '@react-navigation/native';
import { FollowingStackParamList } from './Following/FollowingStack';

export enum HomeTabsRoutes {
  Following = 'Following',
  Top = 'Top',
  Browse = 'Browse',
  Search = 'Search',
}

export type HomeTabsParamList = {
  [HomeTabsRoutes.Following]: undefined;
  [HomeTabsRoutes.Top]: undefined;
  [HomeTabsRoutes.Browse]: undefined;
  [HomeTabsRoutes.Search]: undefined;
};

export type HomeNavigation = NavigationProp<HomeTabsParamList>;

export const HomeTabs = createBottomTabNavigator<HomeTabsParamList>();

export type HomeTabsScreenProps<RouteName extends HomeTabsRoutes> =
  BottomTabScreenProps<HomeTabsParamList, RouteName>;
