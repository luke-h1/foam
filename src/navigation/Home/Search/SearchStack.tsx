import {
  createStackNavigator,
  StackScreenProps,
} from '@react-navigation/stack';

export enum SearchRoutes {
  Search = 'Search',
}

export type SearchStackParamList = {
  [SearchRoutes.Search]: undefined;
};

export const SearchStack = createStackNavigator<SearchStackParamList>();

export type SearchStackScreenProps<RouteName extends SearchRoutes> =
  StackScreenProps<SearchStackParamList, RouteName>;
