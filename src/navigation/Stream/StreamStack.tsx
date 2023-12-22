import { NavigationProp } from '@react-navigation/native';
import {
  StackScreenProps,
  createStackNavigator,
} from '@react-navigation/stack';

/* eslint-disable no-shadow */
export enum StreamRoutes {
  LiveStream = 'LiveStream',
  StreamerProfile = 'StreamerProfile',
}

export type StreamStackParamList = {
  [StreamRoutes.LiveStream]: { id: string };
  [StreamRoutes.StreamerProfile]: { id: string };
};

export type StreamRouteParams = keyof StreamStackParamList;

export type StreamStackNavigationProp = NavigationProp<StreamStackParamList>;

export const StreamStack = createStackNavigator<StreamStackParamList>();

export type StreamStackScreenProps<RouteName extends StreamRoutes> =
  StackScreenProps<StreamStackParamList, RouteName>;
