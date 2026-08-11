import { Stack } from 'expo-router';

import { StreamListLayoutMenu } from '@app/components/StreamListLayoutToggle/StreamListLayoutMenu';
import {
  nativeStackScreenOptions,
  nativeStackTabRootScreenOptions,
} from '@app/utils/navigation/nativeStackOptions';

export default function FollowingLayout() {
  return (
    <Stack screenOptions={nativeStackScreenOptions}>
      <Stack.Screen
        name='index'
        options={{
          title: 'Following',
          ...nativeStackTabRootScreenOptions,
          headerRight: () => <StreamListLayoutMenu />,
        }}
      />
    </Stack>
  );
}
