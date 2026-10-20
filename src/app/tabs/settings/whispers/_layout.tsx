import { Stack } from 'expo-router';

import { useWhisperIrcSession } from '@app/screens/whispers/hooks/use-whisper-irc-session';
import { theme } from '@app/styles/themes';
import { nativeStackScreenOptions } from '@app/utils/navigation/native-stack-options';

/**
 * Owns the whispers IRC session for the lifetime of this stack. Leaving
 * Settings → Whispers unmounts the layout and closes the socket.
 */
export default function WhispersLayout() {
  useWhisperIrcSession();

  return (
    <Stack
      screenOptions={{
        ...nativeStackScreenOptions,
        // Inbox chrome sits above the list, so keep the header opaque.
        headerTransparent: false,
        headerStyle: { backgroundColor: theme.color.background.dark },
        headerBackTitle: 'Whispers',
      }}
    >
      <Stack.Screen name='index' options={{ title: 'Whispers' }} />
      <Stack.Screen name='[login]' options={{ title: 'Whisper' }} />
      <Stack.Screen
        name='compose'
        options={{
          title: 'New whisper',
          presentation: 'formSheet',
          sheetAllowedDetents: 'fitToContents',
          headerShown: false,
        }}
      />
    </Stack>
  );
}
