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
import { StreamStackParamList } from './Stream/StreamStack';

// eslint-disable-next-line no-shadow
export enum RootRoutes {
  AuthLoading = 'AuthLoading',
  Welcome = 'Welcome',
  Home = 'Home',
  Category = 'Category',
  Stream = 'Stream',
  // SettingsModal = 'SettingsModal',
  Settings = 'Settings',
}

// TODO: rework this into seperate navigators
export type RootStackParamList = {
  [RootRoutes.AuthLoading]: undefined;
  [RootRoutes.Welcome]: undefined;
  [RootRoutes.Home]: NavigatorScreenParams<HomeTabsParamList>;
  [RootRoutes.Stream]: {
    screen: keyof StreamStackParamList;
    params: StreamStackParamList[keyof StreamStackParamList];
  };
  [RootRoutes.Category]: NavigatorScreenParams<CategoryStackParamList>;
  [RootRoutes.Settings]: undefined;
};

export type RootRoutesParams = keyof RootStackParamList;

export type RootStackNavigationProp = NavigationProp<RootStackParamList>;

export const RootStack = createStackNavigator<RootStackParamList>();

export type RootStackScreenProps<RouteName extends RootRoutes> =
  StackScreenProps<RootStackParamList, RouteName>;
