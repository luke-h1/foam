import {
  createStackNavigator,
  StackScreenProps,
} from '@react-navigation/stack';

export enum TopRoutes {
  Top = 'TopStreams',
}

export type TopStackParamList = {
  [TopRoutes.Top]: undefined;
};

export const TopStack = createStackNavigator<TopStackParamList>();

export type TopStackScreenProps<RouteName extends TopRoutes> = StackScreenProps<
  TopStackParamList,
  RouteName
>;
