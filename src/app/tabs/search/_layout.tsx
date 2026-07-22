import { useTranslation } from 'react-i18next';

import { Stack } from 'expo-router';

import { useNativeStackScreenOptions } from '@app/utils/navigation/nativeStackOptions';

export default function SearchLayout() {
  const { t } = useTranslation('navigation');
  const nativeStackScreenOptions = useNativeStackScreenOptions();
  return (
    <Stack screenOptions={nativeStackScreenOptions}>
      <Stack.Screen
        name='index'
        options={{
          title: t('search'),
          headerLargeTitle: false,
          headerTransparent: false,
        }}
      />
    </Stack>
  );
}
