import { Stack } from 'expo-router';

import { withDevToolsGate } from '@app/components/dev-tools-gate/withDevToolsGate';
import { nativeStackScreenOptions } from '@app/utils/navigation/nativeStackOptions';

function DevToolsLayout() {
  return (
    <Stack screenOptions={nativeStackScreenOptions}>
      <Stack.Screen
        name='changelog'
        options={{ title: 'Changelog Demo', headerBackTitle: 'Dev Tools' }}
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

export default withDevToolsGate(DevToolsLayout);
