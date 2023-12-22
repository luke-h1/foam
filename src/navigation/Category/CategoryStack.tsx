import { NavigationProp } from '@react-navigation/native';
import {
  StackScreenProps,
  createStackNavigator,
} from '@react-navigation/stack';

// eslint-disable-next-line no-shadow
export enum CategoryRoutes {
  Category = 'Category',
}

export type CategoryStackParamList = {
  [CategoryRoutes.Category]: { id: string };
};

export type CategoryRouteParams = keyof CategoryStackParamList;

export type CategoryStackNavigationProp =
  NavigationProp<CategoryStackParamList>;

export const CategoryStack = createStackNavigator<CategoryStackParamList>();

export type CategoryStackScreenProps<RouteName extends CategoryRoutes> =
  StackScreenProps<CategoryStackParamList, RouteName>;
