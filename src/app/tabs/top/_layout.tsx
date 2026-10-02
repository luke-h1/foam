import { NativeStackHeaderItemProps, Stack } from 'expo-router';

import { StreamListLayoutMenu } from '@app/components/stream-list-layout-toggle/stream-list-layout-menu';
import { nativeStackScreenOptions } from '@app/utils/navigation/native-stack-options';

const headerRight = (_props: NativeStackHeaderItemProps) => {
  return <StreamListLayoutMenu />;
};

export default function TopLayout() {
  return (
    <Stack screenOptions={nativeStackScreenOptions}>
      <Stack.Screen
        name='index'
        options={{
          title: 'Top',
          headerRight,
        }}
      />
    </Stack>
  );
}
