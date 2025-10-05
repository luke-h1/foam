import { Stack } from 'expo-router';

export default function SettingsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="about" />
      <Stack.Screen name="appearance" />
      <Stack.Screen name="changelog" />
      <Stack.Screen name="faq" />
      <Stack.Screen name="licenses" />
      <Stack.Screen name="other" />
      <Stack.Screen name="profile" />
    </Stack>
  );
}
