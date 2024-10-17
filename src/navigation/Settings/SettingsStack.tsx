import { NavigationProp } from '@react-navigation/native';
import {
  createStackNavigator,
  StackScreenProps,
} from '@react-navigation/stack';

export enum SettingsRoutes {
  Settings = 'Settings',
  Login = 'Login',
  Changelogs = 'Changelogs',
}

export type SettingsStackParamList = {
  [SettingsRoutes.Settings]: undefined;
  [SettingsRoutes.Login]: undefined;
  [SettingsRoutes.Changelogs]: undefined;
};

export type SettingsRouteParams = keyof SettingsStackParamList;

export type SettingsStackNavigationProps =
  NavigationProp<SettingsStackParamList>;

export const SettingsStack = createStackNavigator<SettingsStackParamList>();

export type SettingsStackScreenProps<RouteName extends SettingsRoutes> =
  StackScreenProps<SettingsStackParamList, RouteName>;
