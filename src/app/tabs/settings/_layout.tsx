import {
  nativeStackScreenOptions,
  nativeStackTabRootScreenOptions,
} from '@app/utils/navigation/nativeStackOptions';
import { Stack } from 'expo-router';

export default function SettingsLayout() {
  return (
    <Stack screenOptions={nativeStackScreenOptions}>
      <Stack.Screen
        name='index'
        options={{ title: 'Settings', ...nativeStackTabRootScreenOptions }}
      />
      <Stack.Screen
        name='about'
        options={{ title: 'About', headerBackTitle: 'Settings' }}
      />
      <Stack.Screen
        name='appearance'
        options={{ title: 'Appearance', headerBackTitle: 'Settings' }}
      />
      <Stack.Screen
        name='cache'
        options={{ title: 'Cache', headerBackTitle: 'Settings' }}
      />
      <Stack.Screen
        name='cached-images'
        options={{ title: 'Cached Images', headerBackTitle: 'Settings' }}
      />
      <Stack.Screen
        name='changelog'
        options={{ title: 'Changelog', headerBackTitle: 'Settings' }}
      />
      <Stack.Screen
        name='channel-surfing'
        options={{ title: 'Channel Surfing', headerBackTitle: 'Settings' }}
      />
      <Stack.Screen
        name='chat-preferences'
        options={{ title: 'Chat', headerBackTitle: 'Settings' }}
      />
      <Stack.Screen
        name='debug'
        options={{ title: 'Debug', headerBackTitle: 'Settings' }}
      />
      <Stack.Screen
        name='dev-tools'
        options={{ title: 'Dev Tools', headerBackTitle: 'Settings' }}
      />
      <Stack.Screen
        name='diagnostics'
        options={{ title: 'Diagnostics', headerBackTitle: 'Settings' }}
      />
      <Stack.Screen
        name='faq'
        options={{ title: 'FAQ', headerBackTitle: 'Settings' }}
      />
      <Stack.Screen
        name='licenses'
        options={{ title: 'OSS Licenses', headerBackTitle: 'Settings' }}
      />
      <Stack.Screen
        name='other'
        options={{ title: 'Other', headerBackTitle: 'Settings' }}
      />
      <Stack.Screen
        name='profile'
        options={{ title: 'Profile', headerBackTitle: 'Settings' }}
      />
      <Stack.Screen
        name='remote-config'
        options={{ title: 'Remote Config', headerBackTitle: 'Settings' }}
      />
      <Stack.Screen
        name='storybook'
        options={{ title: 'Storybook', headerBackTitle: 'Settings' }}
      />
    </Stack>
  );
}
