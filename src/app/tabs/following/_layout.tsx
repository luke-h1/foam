import {
  nativeStackScreenOptions,
  nativeStackTabRootScreenOptions,
} from '@app/utils/navigation/nativeStackOptions';
import { Stack } from 'expo-router';

export default function FollowingLayout() {
  return (
    <Stack screenOptions={nativeStackScreenOptions}>
      <Stack.Screen
        name='index'
        options={{ title: 'Following', ...nativeStackTabRootScreenOptions }}
      />
    </Stack>
  );
}
