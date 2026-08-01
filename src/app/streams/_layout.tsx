import { Stack } from 'expo-router';

import { theme } from '@app/styles/themes';
import { nativeStackScreenOptions } from '@app/utils/navigation/nativeStackOptions';

export default function StreamsLayout() {
  return (
    <Stack>
      <Stack.Screen
        name='live-stream/[id]'
        options={{
          headerShown: false,
          gestureEnabled: true,
          fullScreenGestureEnabled: true,
        }}
      />
      <Stack.Screen
        name='streamer-profile/[id]'
        options={{
          ...nativeStackScreenOptions,
          title: '',
          gestureEnabled: true,
          fullScreenGestureEnabled: true,
        }}
      />
      <Stack.Screen
        name='clip/[id]'
        options={{
          headerShown: false,
          presentation: 'formSheet',
          sheetGrabberVisible: true,
          sheetAllowedDetents: [0.85],
          sheetCornerRadius: theme.borderRadius28,
          contentStyle: {
            backgroundColor: theme.color.background.dark,
          },
        }}
      />
      <Stack.Screen
        name='vod/[id]'
        options={{
          headerShown: false,
          gestureEnabled: true,
          fullScreenGestureEnabled: true,
        }}
      />
    </Stack>
  );
}
