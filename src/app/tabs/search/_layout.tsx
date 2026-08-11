import { Stack } from 'expo-router';

import {
  nativeStackScreenOptions,
  nativeStackTabRootScreenOptions,
} from '@app/utils/navigation/nativeStackOptions';

export default function SearchLayout() {
  return (
    <Stack screenOptions={nativeStackScreenOptions}>
      <Stack.Screen
        name='index'
        options={{
          title: 'Search',
          ...nativeStackTabRootScreenOptions,
        }}
      />
    </Stack>
  );
}
