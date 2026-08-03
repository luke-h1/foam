import { useTranslation } from 'react-i18next';

import { Stack } from 'expo-router';

import { StreamListLayoutMenu } from '@app/components/StreamListLayoutToggle/StreamListLayoutMenu';
import {
  nativeStackScreenOptions,
  nativeStackTabRootScreenOptions,
} from '@app/utils/navigation/nativeStackOptions';

export default function FollowingLayout() {
  const { t } = useTranslation('navigation');
  return (
    <Stack screenOptions={nativeStackScreenOptions}>
      <Stack.Screen
        name='index'
        options={{
          title: t('following'),
          ...nativeStackTabRootScreenOptions,
          headerRight: () => <StreamListLayoutMenu />,
        }}
      />
    </Stack>
  );
}
