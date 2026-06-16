import { nativeStackScreenOptions } from '@app/utils/navigation/nativeStackOptions';
import { useIsDevToolsEnabled } from '@app/utils/devTools/devToolsGate';
import { Redirect, Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';

export default function DevToolsLayout() {
  const { t } = useTranslation('navigation');
  const devToolsEnabled = useIsDevToolsEnabled();
  if (!devToolsEnabled) {
    return <Redirect href='/tabs/settings' />;
  }

  return (
    <Stack screenOptions={nativeStackScreenOptions}>
      <Stack.Screen
        name='changelog'
        options={{ title: t('changelogDemo'), headerBackTitle: t('devTools') }}
      />
      <Stack.Screen
        name='debug'
        options={{ title: t('debug'), headerBackTitle: t('devTools') }}
      />
      <Stack.Screen
        name='diagnostics'
        options={{ title: t('diagnostics'), headerBackTitle: t('devTools') }}
      />
      <Stack.Screen
        name='sentry-demo'
        options={{ title: t('sentryTest'), headerBackTitle: t('devTools') }}
      />
    </Stack>
  );
}
