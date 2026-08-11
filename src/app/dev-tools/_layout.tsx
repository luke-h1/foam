import { Redirect, Stack } from 'expo-router';

import { useDevToolsAccess } from '@app/utils/devTools/devToolsGate';
import { nativeStackScreenOptions } from '@app/utils/navigation/nativeStackOptions';

export default function DevToolsLayout() {
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
      <Stack.Screen
        name='image-benchmark'
        options={{ title: 'Image Benchmark', headerBackTitle: 'Dev Tools' }}
      />
      <Stack.Screen
        name='chat-perf'
        options={{ title: 'Chat Perf', headerBackTitle: 'Dev Tools' }}
      />
      <Stack.Screen
        name='env-vars'
        options={{
          title: 'Environment Variables',
          headerBackTitle: 'Dev Tools',
        }}
      />
      <Stack.Screen
        name='synced-emotes'
        options={{ title: 'Synced Emotes', headerBackTitle: 'Dev Tools' }}
      />
    </Stack>
  );
}
