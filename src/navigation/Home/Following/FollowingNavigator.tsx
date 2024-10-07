import FollowingScreen from '@app/screens/home/FollowingScreen';
import { FollowingRoutes, FollowingStack } from './FollowingStack';

export default function FollowingNavigator() {
  return (
    <FollowingStack.Navigator
      initialRouteName={FollowingRoutes.Following}
      screenOptions={{ headerShown: false }}
    >
      <FollowingStack.Screen
        name={FollowingRoutes.Following}
        component={FollowingScreen}
      />
    </FollowingStack.Navigator>
  );
}
