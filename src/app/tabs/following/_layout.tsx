import { Stack } from 'expo-router';

import {
  nativeStackScreenOptions,
  nativeStackTabRootScreenOptions,
} from '@app/utils/navigation/native-stack-options';

export default function FollowingLayout() {
  return (
    <Stack screenOptions={nativeStackScreenOptions}>
      <Stack.Screen
        name='index'
        options={{
          title: 'Following',
          ...nativeStackTabRootScreenOptions,
        }}
      />
    </Stack>
  );
}
