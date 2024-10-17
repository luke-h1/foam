import SearchScreen from '@app/screens/SearchScreen';
import { SearchRoutes, SearchStack } from './SearchStack';

export default function SearchStackNavigator() {
  return (
    <SearchStack.Navigator
      initialRouteName={SearchRoutes.Search}
      screenOptions={{ headerShown: false }}
    >
      <SearchStack.Screen name={SearchRoutes.Search} component={SearchScreen} />
    </SearchStack.Navigator>
  );
}
