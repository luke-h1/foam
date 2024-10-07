import {
  createStackNavigator,
  StackScreenProps,
} from '@react-navigation/stack';

export enum FollowingRoutes {
  Following = 'Following',
}

export type FollowingStackParamList = {
  [FollowingRoutes.Following]: undefined;
};

export const FollowingStack = createStackNavigator<FollowingStackParamList>();

export type FollowingStackScreenProps<RouteName extends FollowingRoutes> =
  StackScreenProps<FollowingStackParamList, RouteName>;
