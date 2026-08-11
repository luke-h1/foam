import { Stack } from 'expo-router';

import { StreamListLayoutMenu } from '@app/components/StreamListLayoutToggle/StreamListLayoutMenu';
import { nativeStackScreenOptions } from '@app/utils/navigation/nativeStackOptions';

export default function TopLayout() {
  return (
    <Stack screenOptions={nativeStackScreenOptions}>
      <Stack.Screen
        name='index'
        options={{
          title: 'Top',
          headerTransparent: false,
          headerRight: () => <StreamListLayoutMenu />,
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
