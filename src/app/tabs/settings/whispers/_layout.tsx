import { Stack } from "expo-router";

import { useWhisperIrcSession } from "@app/screens/whispers/hooks/use-whisper-irc-session";
import { nativeStackScreenOptions } from "@app/utils/navigation/native-stack-options";

export default function WhispersLayout() {
  useWhisperIrcSession();

  return (
    <Stack
      screenOptions={{
        ...nativeStackScreenOptions,
        headerBackTitle: "Whispers",
      }}
    >
      <Stack.Screen name="index" options={{ title: "Whispers" }} />
      <Stack.Screen name="[login]" options={{ title: "Whisper" }} />
      <Stack.Screen
        name="compose"
        options={{
          title: "New whisper",
          presentation: "formSheet",
          sheetAllowedDetents: "fitToContents",
          headerShown: false,
        }}
      />
    </Stack>
  );
}
