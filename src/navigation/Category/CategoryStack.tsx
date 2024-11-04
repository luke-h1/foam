import { NavigationProp } from '@react-navigation/native';
import {
  StackScreenProps,
  createStackNavigator,
} from '@react-navigation/stack';

export enum CategoryRoutes {
  Category = 'Category',
}

export type CategoryStackParamList = {
  // FIX ME TO USE NAVIGATION SCREEN PARAMS
  // i.e.
  // [HomeTabsRoutes.Category]: NavigatorScreenParams<CategoryStackParamList>;
  [CategoryRoutes.Category]: {
    id: string;
  };
};

export type CategoryRouteParams = keyof CategoryStackParamList;

export type CategoryStackNavigationProp =
  NavigationProp<CategoryStackParamList>;

export const CategoryStack = createStackNavigator<CategoryStackParamList>();

export type CategoryStackScreenProps<RouteName extends CategoryRoutes> =
  StackScreenProps<CategoryStackParamList, RouteName>;
