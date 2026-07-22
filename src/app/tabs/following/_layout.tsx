import { useTranslation } from 'react-i18next';

import { Stack } from 'expo-router';

import {
  nativeStackTabRootScreenOptions,
  useNativeStackScreenOptions,
} from '@app/utils/navigation/nativeStackOptions';

export default function FollowingLayout() {
  const { t } = useTranslation('navigation');
  const nativeStackScreenOptions = useNativeStackScreenOptions();
  return (
    <Stack screenOptions={nativeStackScreenOptions}>
      <Stack.Screen
        name='index'
        options={{ title: t('following'), ...nativeStackTabRootScreenOptions }}
      />
    </Stack>
  );
}
