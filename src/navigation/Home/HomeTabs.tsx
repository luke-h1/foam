import {
  BottomTabScreenProps,
  createBottomTabNavigator,
} from '@react-navigation/bottom-tabs';
import {
  NavigationProp,
  NavigatorScreenParams,
} from '@react-navigation/native';
import { CategoryStackParamList } from '../Category/CategoryStack';
import { StreamStackParamList } from '../Stream/StreamStack';

// eslint-disable-next-line no-shadow
export enum HomeTabsRoutes {
  Following = 'Following',
  Top = 'Top',
  Browse = 'Browse',
  Search = 'Search',
  LiveStream = 'LiveStream',
  Category = 'Category',
}

export type HomeTabsParamList = {
  [HomeTabsRoutes.Following]: undefined;
  [HomeTabsRoutes.Top]: undefined;
  [HomeTabsRoutes.Browse]: undefined;
  [HomeTabsRoutes.Search]: undefined;
  [HomeTabsRoutes.LiveStream]: NavigatorScreenParams<StreamStackParamList>;
  [HomeTabsRoutes.Category]: NavigatorScreenParams<CategoryStackParamList>;
};

export type HomeNavigation = NavigationProp<HomeTabsParamList>;

export const HomeTabs = createBottomTabNavigator<HomeTabsParamList>();

export type HomeTabsScreenProps<RouteName extends HomeTabsRoutes> =
  BottomTabScreenProps<HomeTabsParamList, RouteName>;
