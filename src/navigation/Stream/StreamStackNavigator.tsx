import LiveStreamScreen from '@app/screens/Stream/LiveStreamScreen';
import { StreamRoutes, StreamStack } from './StreamStack';

const StreamStackNavigator = () => {
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
};

export default StreamStackNavigator;
