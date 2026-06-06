import { nativeStackScreenOptions } from '@app/utils/navigation/nativeStackOptions';
import { Stack } from 'expo-router';

export default function PreferencesLayout() {
  return (
    <Stack screenOptions={nativeStackScreenOptions}>
      <Stack.Screen
        name='blocked-users'
        options={{ title: 'Blocked Users', headerBackTitle: 'Profile' }}
      />
      <Stack.Screen
        name='chat'
        options={{ title: 'Chat', headerBackTitle: 'Settings' }}
      />
      <Stack.Screen
        name='theming'
        options={{ title: 'Theme', headerBackTitle: 'Settings' }}
      />
      <Stack.Screen
        name='video'
        options={{ title: 'Video', headerBackTitle: 'Settings' }}
      />
    </Stack>
  );
}
