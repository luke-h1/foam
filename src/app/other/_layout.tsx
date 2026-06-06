import { nativeStackScreenOptions } from '@app/utils/navigation/nativeStackOptions';
import { Stack } from 'expo-router';

export default function OtherLayout() {
  return (
    <Stack screenOptions={nativeStackScreenOptions}>
      <Stack.Screen
        name='about'
        options={{ title: 'About', headerBackTitle: 'Other' }}
      />
      <Stack.Screen
        name='changelog'
        options={{ title: 'Changelog', headerBackTitle: 'Other' }}
      />
      <Stack.Screen
        name='faq'
        options={{ title: 'FAQ', headerBackTitle: 'Other' }}
      />
      <Stack.Screen
        name='licenses'
        options={{ title: 'OSS Licenses', headerBackTitle: 'Other' }}
      />
    </Stack>
  );
}
