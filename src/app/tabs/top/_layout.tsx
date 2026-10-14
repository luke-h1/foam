import { Stack } from 'expo-router';

import { nativeStackScreenOptions } from '@app/utils/navigation/native-stack-options';

export default function TopLayout() {
  return (
    <Stack screenOptions={nativeStackScreenOptions}>
      <Stack.Screen name='index' options={{ title: 'Top' }} />
    </Stack>
  );
}
