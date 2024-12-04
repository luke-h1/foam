import LiveStreamScreen from '@app/screens/Stream/LiveStreamScreen';
import StreamerProfileScreen from '@app/screens/Stream/StreamerProfileScreen';
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
      <StreamStack.Screen
        name={StreamRoutes.StreamerProfile}
        component={StreamerProfileScreen}
      />
    </StreamStack.Navigator>
  );
}
