import { nativeStackScreenOptions } from '@app/utils/navigation/nativeStackOptions';
import { isDevToolsEnabled } from '@app/utils/devTools/devToolsGate';
import { Redirect, Stack } from 'expo-router';

export default function DevToolsLayout() {
  if (!isDevToolsEnabled) {
    return <Redirect href='/tabs/settings' />;
  }

  return (
    <Stack screenOptions={nativeStackScreenOptions}>
      <Stack.Screen
        name='changelog'
        options={{ title: 'Changelog Demo', headerBackTitle: 'Dev Tools' }}
      />
      <Stack.Screen
        name='debug'
        options={{ title: 'Debug', headerBackTitle: 'Dev Tools' }}
      />
      <Stack.Screen
        name='diagnostics'
        options={{ title: 'Diagnostics', headerBackTitle: 'Dev Tools' }}
      />
      <Stack.Screen
        name='sentry-demo'
        options={{ title: 'Sentry Test', headerBackTitle: 'Dev Tools' }}
      />
    </Stack>
  );
}
