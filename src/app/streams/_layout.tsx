import { Stack } from 'expo-router';

export default function StreamsLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="live-stream/[id]"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="streamer-profile/[id]"
        options={{
          headerShown: false,
          presentation: 'modal',
        }}
      />
      <Stack.Screen
        name="clip/[id]"
        options={{
          headerShown: false,
          presentation: 'modal',
        }}
      />
    </Stack>
  );
}
