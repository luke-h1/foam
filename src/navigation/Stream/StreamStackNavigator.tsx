import LiveStreamScreen from '@app/screens/Stream/LiveStreamScreen';
import { StreamRoutes, StreamStack } from './StreamStack';

export default function StreamStackNavigator() {
  return (
    <StreamStack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <StreamStack.Screen
        name={StreamRoutes.LiveStream}
        component={LiveStreamScreen}
      />
    </StreamStack.Navigator>
  );
}
