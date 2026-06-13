import { nativeStackScreenOptions } from '@app/utils/navigation/nativeStackOptions';
import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';

export default function SearchLayout() {
  const { t } = useTranslation('navigation');
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
