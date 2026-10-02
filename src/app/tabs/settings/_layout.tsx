import { Stack } from 'expo-router';

import {
  nativeStackScreenOptions,
  nativeStackTabRootScreenOptions,
} from '@app/utils/navigation/native-stack-options';

export default function SettingsLayout() {
  return (
    <Stack
      screenOptions={{
        ...nativeStackScreenOptions,
        headerBackTitle: 'Settings',
      }}
    >
      <Stack.Screen
        name='index'
        options={{ title: 'Settings', ...nativeStackTabRootScreenOptions }}
      />
      <Stack.Screen name='about' options={{ title: 'About' }} />
      <Stack.Screen name='appearance' options={{ title: 'Haptics' }} />
      <Stack.Screen name='cache' options={{ title: 'Storage' }} />
      <Stack.Screen name='cached-images' options={{ title: 'Cached images' }} />
      <Stack.Screen name='blocked-terms' options={{ title: 'Blocked terms' }} />
      <Stack.Screen
        name='channel-surfing'
        options={{ title: 'Channel surfing' }}
      />
      <Stack.Screen name='chat-highlights' options={{ title: 'Highlights' }} />
      <Stack.Screen name='chat-preferences' options={{ title: 'Chat' }} />
      <Stack.Screen name='my-clips' options={{ title: 'My clips' }} />
      <Stack.Screen name='debug' options={{ title: 'Debug' }} />
      <Stack.Screen name='dev-tools' options={{ title: 'Dev tools' }} />
      <Stack.Screen name='diagnostics' options={{ title: 'Diagnostics' }} />
      <Stack.Screen
        name='emotes-and-badges'
        options={{
          title: 'Emotes and badges',
        }}
      />
      <Stack.Screen name='licenses' options={{ title: 'Licenses' }} />
      <Stack.Screen name='other' options={{ title: 'Privacy' }} />
      <Stack.Screen name='profile' options={{ title: 'Profile' }} />
      <Stack.Screen name='remote-config' options={{ title: 'Remote Config' }} />
      <Stack.Screen name='saved-phrases' options={{ title: 'Saved phrases' }} />
      <Stack.Screen name='storybook' options={{ title: 'Storybook' }} />
    </Stack>
  );
}
