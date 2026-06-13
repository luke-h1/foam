import {
  nativeStackScreenOptions,
  nativeStackTabRootScreenOptions,
} from '@app/utils/navigation/nativeStackOptions';
import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';

export default function FollowingLayout() {
  const { t } = useTranslation('navigation');
  return (
    <Stack screenOptions={nativeStackScreenOptions}>
      <Stack.Screen
        name='index'
        options={{ title: t('following'), ...nativeStackTabRootScreenOptions }}
      />
    </Stack>
  );
}
