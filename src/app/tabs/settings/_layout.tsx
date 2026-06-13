import {
  nativeStackScreenOptions,
  nativeStackTabRootScreenOptions,
} from '@app/utils/navigation/nativeStackOptions';
import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';

export default function SettingsLayout() {
  const { t } = useTranslation('navigation');
  return (
    <Stack screenOptions={nativeStackScreenOptions}>
      <Stack.Screen
        name='index'
        options={{ title: t('settings'), ...nativeStackTabRootScreenOptions }}
      />
      <Stack.Screen
        name='about'
        options={{ title: t('about'), headerBackTitle: t('settings') }}
      />
      <Stack.Screen
        name='appearance'
        options={{ title: t('appearance'), headerBackTitle: t('settings') }}
      />
      <Stack.Screen
        name='cache'
        options={{ title: t('cache'), headerBackTitle: t('settings') }}
      />
      <Stack.Screen
        name='cached-images'
        options={{ title: t('cachedImages'), headerBackTitle: t('settings') }}
      />
      <Stack.Screen
        name='changelog'
        options={{ title: t('changelog'), headerBackTitle: t('settings') }}
      />
      <Stack.Screen
        name='blocked-terms'
        options={{ title: t('blockedTerms'), headerBackTitle: t('settings') }}
      />
      <Stack.Screen
        name='channel-surfing'
        options={{ title: t('channelSurfing'), headerBackTitle: t('settings') }}
      />
      <Stack.Screen
        name='chat-highlights'
        options={{ title: t('highlights'), headerBackTitle: t('settings') }}
      />
      <Stack.Screen
        name='chat-preferences'
        options={{ title: t('chat'), headerBackTitle: t('settings') }}
      />
      <Stack.Screen
        name='debug'
        options={{ title: t('debug'), headerBackTitle: t('settings') }}
      />
      <Stack.Screen
        name='dev-tools'
        options={{ title: t('devTools'), headerBackTitle: t('settings') }}
      />
      <Stack.Screen
        name='diagnostics'
        options={{ title: t('diagnostics'), headerBackTitle: t('settings') }}
      />
      <Stack.Screen
        name='faq'
        options={{ title: t('faq'), headerBackTitle: t('settings') }}
      />
      <Stack.Screen
        name='licenses'
        options={{ title: t('ossLicenses'), headerBackTitle: t('settings') }}
      />
      <Stack.Screen
        name='other'
        options={{ title: t('other'), headerBackTitle: t('settings') }}
      />
      <Stack.Screen
        name='profile'
        options={{ title: t('profile'), headerBackTitle: t('settings') }}
      />
      <Stack.Screen
        name='remote-config'
        options={{ title: t('remoteConfig'), headerBackTitle: t('settings') }}
      />
      <Stack.Screen
        name='storybook'
        options={{ title: t('storybook'), headerBackTitle: t('settings') }}
      />
    </Stack>
  );
}
