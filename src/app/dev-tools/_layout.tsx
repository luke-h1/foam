import { nativeStackScreenOptions } from '@app/utils/navigation/nativeStackOptions';
import { Stack } from 'expo-router';

export default function DevToolsLayout() {
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
