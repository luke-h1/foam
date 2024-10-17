import {
  BottomTabScreenProps,
  createBottomTabNavigator,
} from '@react-navigation/bottom-tabs';
import { NavigationProp } from '@react-navigation/native';

// eslint-disable-next-line no-shadow
export enum HomeTabsRoutes {
  Following = 'Following',
  Top = 'Top',
  Browse = 'Browse',
  Search = 'Search',
  Account = 'Account',
}

export type HomeTabsParamList = {
  [HomeTabsRoutes.Following]: undefined;
  [HomeTabsRoutes.Top]: undefined;
  [HomeTabsRoutes.Browse]: undefined;
  [HomeTabsRoutes.Search]: undefined;
  [HomeTabsRoutes.Account]: undefined;
};

export type HomeNavigation = NavigationProp<HomeTabsParamList>;

export const HomeTabs = createBottomTabNavigator<HomeTabsParamList>();

export type HomeTabsScreenProps<RouteName extends HomeTabsRoutes> =
  BottomTabScreenProps<HomeTabsParamList, RouteName>;
