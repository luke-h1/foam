import { Stack } from 'expo-router';

import { nativeStackScreenOptions } from '@app/utils/navigation/native-stack-options';

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
    </Stack>
  );
}
