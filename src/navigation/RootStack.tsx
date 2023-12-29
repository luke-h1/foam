import { NavigationProp } from '@react-navigation/native';
import {
  createStackNavigator,
  StackScreenProps,
} from '@react-navigation/stack';

// eslint-disable-next-line no-shadow
export enum RootRoutes {
  AuthLoading = 'AuthLoading',
  Welcome = 'Welcome',
  Home = 'Home',
  SettingsModal = 'SettingsModal',
  Login = 'Login',
  LiveStream = 'LiveStream',
  Category = 'Category',
}

export type RootStackParamList = {
  [RootRoutes.AuthLoading]: undefined;
  [RootRoutes.Welcome]: undefined;
  [RootRoutes.Home]: undefined;
  [RootRoutes.SettingsModal]: undefined;
  [RootRoutes.Login]: undefined;
  [RootRoutes.LiveStream]: undefined;
  [RootRoutes.Category]: undefined;
};

export type RootRoutesParams = keyof RootStackParamList;

export type RootStackNavigationProp = NavigationProp<RootStackParamList>;

export const RootStack = createStackNavigator<RootStackParamList>();

export type RootStackScreenProps<RouteName extends RootRoutes> =
  StackScreenProps<RootStackParamList, RouteName>;
