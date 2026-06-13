import { nativeStackScreenOptions } from '@app/utils/navigation/nativeStackOptions';
import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';

export default function PreferencesLayout() {
  const { t } = useTranslation('navigation');
  return (
    <Stack screenOptions={nativeStackScreenOptions}>
      <Stack.Screen
        name='blocked-users'
        options={{ title: t('blockedUsers'), headerBackTitle: t('profile') }}
      />
      <Stack.Screen
        name='chat'
        options={{ title: t('chat'), headerBackTitle: t('settings') }}
      />
      <Stack.Screen
        name='theming'
        options={{ title: t('theme'), headerBackTitle: t('settings') }}
      />
      <Stack.Screen
        name='video'
        options={{ title: t('video'), headerBackTitle: t('settings') }}
      />
    </Stack>
  );
}
