import TopScreen from '@app/screens/home/Top/TopScreen';
import { TopRoutes, TopStack } from './TopStack';

export default function TopNavigator() {
  return (
    <TopStack.Navigator
      initialRouteName={TopRoutes.Top}
      screenOptions={{ headerShown: false }}
    >
      <TopStack.Screen name={TopRoutes.Top} component={TopScreen} />
    </TopStack.Navigator>
  );
}