import { useTranslation } from 'react-i18next';

import { Stack } from 'expo-router';

import { nativeStackScreenOptions } from '@app/utils/navigation/nativeStackOptions';

export default function OtherLayout() {
  const { t } = useTranslation('navigation');
  return (
    <Stack screenOptions={nativeStackScreenOptions}>
      <Stack.Screen
        name='about'
        options={{ title: t('about'), headerBackTitle: t('other') }}
      />
      <Stack.Screen
        name='changelog'
        options={{ title: t('changelog'), headerBackTitle: t('other') }}
      />
      <Stack.Screen
        name='faq'
        options={{ title: t('faq'), headerBackTitle: t('other') }}
      />
      <Stack.Screen
        name='licenses'
        options={{ title: t('ossLicenses'), headerBackTitle: t('other') }}
      />
    </Stack>
  );
}
