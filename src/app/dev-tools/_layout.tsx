import { nativeStackScreenOptions } from '@app/utils/navigation/nativeStackOptions';
import { useDevToolsAccess } from '@app/utils/devTools/devToolsGate';
import { Redirect, Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';

export default function DevToolsLayout() {
  const { t } = useTranslation('navigation');
  const access = useDevToolsAccess();
  if (access === 'pending') {
    return null;
  }
  if (access === 'denied') {
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
      <Stack.Screen
        name='image-benchmark'
        options={{ title: 'Image Benchmark', headerBackTitle: t('devTools') }}
      />
      <Stack.Screen
        name='chat-perf'
        options={{ title: 'Chat Perf', headerBackTitle: t('devTools') }}
      />
    </Stack>
  );
}
