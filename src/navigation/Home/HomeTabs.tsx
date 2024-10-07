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
  FollowingStack = 'FollowingStack',
  TopStack = 'TopStack',
}

export type HomeTabsParamList = {
  [HomeTabsRoutes.FollowingStack]: NavigatorScreenParams<FollowingStackParamList>;
  [HomeTabsRoutes.TopStack]: undefined;
};

export type HomeNavigation = NavigationProp<HomeTabsParamList>;

export const HomeTabs = createBottomTabNavigator<HomeTabsParamList>();

export type HomeTabsScreenProps<RouteName extends HomeTabsRoutes> =
  BottomTabScreenProps<HomeTabsParamList, RouteName>;
