import { ScreenSuspense } from '@app/components/ScreenSuspense';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StackScreenProps } from '@react-navigation/stack';
import { ComponentType, lazy } from 'react';

export type StreamStackParamList = {
  LiveStream: { id: string };
  StreamerProfile: { id: string };
};

const Stack = createNativeStackNavigator<StreamStackParamList>();

export type StreamStackScreenProps<T extends keyof StreamStackParamList> =
  StackScreenProps<StreamStackParamList, T>;

const LazyLiveStreamScreen = lazy(() =>
  import('@app/screens/Stream/LiveStreamScreen').then(m => ({
    default: m.LiveStreamScreen,
  })),
);
const LazyStreamerProfileScreen = lazy(() =>
  import('@app/screens/Stream/StreamerProfileScreen').then(m => ({
    default: m.StreamerProfileScreen,
  })),
);

function withSuspense<P extends object>(
  LazyComponent: ComponentType<P>,
): ComponentType<P> {
  return function SuspenseWrapper(props: P) {
    return (
      <ScreenSuspense>
        <LazyComponent {...props} />
      </ScreenSuspense>
    );
  };
}

const LiveStreamScreen = withSuspense(LazyLiveStreamScreen);
const StreamerProfileScreen = withSuspense(LazyStreamerProfileScreen);

export function StreamStackNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="LiveStream"
        component={LiveStreamScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="StreamerProfile"
        component={StreamerProfileScreen}
        options={{
          headerShown: false,
          orientation: 'portrait_up',
          presentation: 'modal',
        }}
      />
    </Stack.Navigator>
  );
}
