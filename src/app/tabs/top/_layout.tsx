import { useTranslation } from 'react-i18next';

import { Stack } from 'expo-router';

import { StreamListLayoutMenu } from '@app/components/StreamListLayoutToggle/StreamListLayoutMenu';
import {
  nativeStackScreenOptions,
  nativeStackTabRootScreenOptions,
} from '@app/utils/navigation/nativeStackOptions';

export default function TopLayout() {
  const { t } = useTranslation('navigation');
  return (
    <Stack screenOptions={nativeStackScreenOptions}>
      <Stack.Screen
        name='index'
        options={{
          title: t('top'),
          ...nativeStackTabRootScreenOptions,
          headerRight: () => <StreamListLayoutMenu />,
        }}
      />
      <Stack.Screen
        name='categories'
        options={{ title: t('categories'), headerBackTitle: t('top') }}
      />
      <Stack.Screen
        name='streams'
        options={{ title: t('streams'), headerBackTitle: t('top') }}
      />
    </Stack>
  );
}
