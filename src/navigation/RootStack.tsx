import { NavigationProp } from '@react-navigation/native';
import {
  createStackNavigator,
  StackScreenProps,
} from '@react-navigation/stack';

// eslint-disable-next-line no-shadow
export enum RootRoutes {
  /* 
    This is not called 'Loading' because we either need to fetch a defaultToken
    for an unauthenticated user or we need to check if the token is valid and then if it isn't,
    we need to either refresh it or fetch a defaultToken
    */
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
