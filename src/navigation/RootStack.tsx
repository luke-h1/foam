import {
  NavigationProp,
  NavigatorScreenParams,
} from '@react-navigation/native';
import {
  createStackNavigator,
  StackScreenProps,
} from '@react-navigation/stack';
import { CategoryStackParamList } from './Category/CategoryStack';
import { HomeTabsParamList } from './Home/HomeTabs';

// eslint-disable-next-line no-shadow
export enum RootRoutes {
  AuthLoading = 'AuthLoading',
  Welcome = 'Welcome',
  Home = 'Home',
  Category = 'Category',
  // SettingsModal = 'SettingsModal',
  Settings = 'Settings',
}

// TODO: rework this into seperate navigators
export type RootStackParamList = {
  [RootRoutes.AuthLoading]: undefined;
  [RootRoutes.Welcome]: undefined;
  [RootRoutes.Home]: NavigatorScreenParams<HomeTabsParamList>;
  [RootRoutes.Category]: NavigatorScreenParams<CategoryStackParamList>;
  [RootRoutes.Settings]: undefined;
};

export type RootRoutesParams = keyof RootStackParamList;

export type RootStackNavigationProp = NavigationProp<RootStackParamList>;

export const RootStack = createStackNavigator<RootStackParamList>();

export type RootStackScreenProps<RouteName extends RootRoutes> =
  StackScreenProps<RootStackParamList, RouteName>;
