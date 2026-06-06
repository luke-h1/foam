import { nativeStackScreenOptions } from '@app/utils/navigation/nativeStackOptions';
import { Stack } from 'expo-router';

export default function SearchLayout() {
  return (
    <Stack screenOptions={nativeStackScreenOptions}>
      <Stack.Screen
        name='index'
        options={{
          title: 'Search',
          headerLargeTitle: false,
          headerTransparent: false,
        }}
      />
    </Stack>
  );
}
