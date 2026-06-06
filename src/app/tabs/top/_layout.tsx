import { nativeStackScreenOptions } from '@app/utils/navigation/nativeStackOptions';
import { Stack } from 'expo-router';

export default function TopLayout() {
  return (
    <Stack screenOptions={nativeStackScreenOptions}>
      <Stack.Screen
        name='index'
        options={{
          title: 'Top',
          headerLargeTitle: false,
          headerTransparent: false,
        }}
      />
      <Stack.Screen
        name='categories'
        options={{ title: 'Categories', headerBackTitle: 'Top' }}
      />
      <Stack.Screen
        name='streams'
        options={{ title: 'Streams', headerBackTitle: 'Top' }}
      />
    </Stack>
  );
}
