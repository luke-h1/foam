import { LiveStreamScreen, StreamerProfileScreen } from '@app/screens';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StackScreenProps } from '@react-navigation/stack';

export type StreamStackParamList = {
  LiveStream: { id: string };
  StreamerProfile: { id: string };
};

const Stack = createNativeStackNavigator<StreamStackParamList>();

export type StreamStackScreenProps<T extends keyof StreamStackParamList> =
  StackScreenProps<StreamStackParamList, T>;

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
        }}
      />
    </Stack.Navigator>
  );
}
