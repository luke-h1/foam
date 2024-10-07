import {
  NavigationProp,
  NavigatorScreenParams,
} from '@react-navigation/native';
import {
  createStackNavigator,
  StackScreenProps,
} from '@react-navigation/stack';
import { HomeTabsParamList } from './Home/HomeTabs';

export enum RootRoutes {
  Welcome = 'Welcome',
  Home = 'Home',
}

export type RootStackParamList = {
  [RootRoutes.Welcome]: undefined;
  [RootRoutes.Home]: NavigatorScreenParams<HomeTabsParamList>;
};

export type RootRouteParams = keyof RootStackParamList;
export type RootStackNavigationProp = NavigationProp<RootStackParamList>;

export const RootStack = createStackNavigator<RootStackParamList>();

export type RootStackScreenProps<RouteName extends RootRoutes> =
  StackScreenProps<RootStackParamList, RouteName>;
