import {
  createStackNavigator,
  StackScreenProps,
} from '@react-navigation/stack';

export enum AccountRoutes {
  Account = 'Account',
  // todo - expand for changelogs, settings, status etc.
}

export type AccountParamList = {
  [AccountRoutes.Account]: undefined;
};

export const AccountStack = createStackNavigator<AccountParamList>();

export type AccountStackScreenProps<RouteName extends AccountRoutes> =
  StackScreenProps<AccountParamList, RouteName>;
