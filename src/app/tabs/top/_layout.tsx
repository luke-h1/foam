import { Stack } from 'expo-router';

export default function TopLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    />
  );
}
