import { ScreenSuspense } from '@app/components/ScreenSuspense';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StackScreenProps } from '@react-navigation/stack';
import { lazy } from 'react';

const LazyBlockedUsersScreen = lazy(() =>
  import('@app/screens/Preferences/BlockedUsersScreen').then(m => ({
    default: m.BlockedUsersScreen,
  })),
);
const LazyChatPreferenceScreen = lazy(() =>
  import('@app/screens/Preferences/ChatPreferenceScreen').then(m => ({
    default: m.ChatPreferenceScreen,
  })),
);
const LazyThemePreferenceScreen = lazy(() =>
  import('@app/screens/Preferences/ThemePreferenceScreen').then(m => ({
    default: m.ThemePreferenceScreen,
  })),
);
const LazyVideoPreferenceScreen = lazy(() =>
  import('@app/screens/Preferences/VideoPreferenceScreen').then(m => ({
    default: m.VideoPreferenceScreen,
  })),
);

const BlockedUsersScreen = () => (
  <ScreenSuspense>
    <LazyBlockedUsersScreen />
  </ScreenSuspense>
);
const ChatPreferenceScreen = () => (
  <ScreenSuspense>
    <LazyChatPreferenceScreen />
  </ScreenSuspense>
);
const ThemePreferenceScreen = () => (
  <ScreenSuspense>
    <LazyThemePreferenceScreen />
  </ScreenSuspense>
);
const VideoPreferenceScreen = () => (
  <ScreenSuspense>
    <LazyVideoPreferenceScreen />
  </ScreenSuspense>
);

export type PreferenceStackParamList = {
  Chat: undefined;
  Video: undefined;
  Theming: undefined;
  BlockedUsers: undefined;
};

const Stack = createNativeStackNavigator<PreferenceStackParamList>();

export type PreferenceStackScreenProps<
  T extends keyof PreferenceStackParamList,
> = StackScreenProps<PreferenceStackParamList, T>;

export function PreferenceStackNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="Chat"
        component={ChatPreferenceScreen}
        options={{
          headerShown: false,
          orientation: 'portrait_up',
        }}
      />
      <Stack.Screen
        name="Theming"
        component={ThemePreferenceScreen}
        options={{
          headerShown: false,
          orientation: 'portrait_up',
        }}
      />
      <Stack.Screen
        name="Video"
        component={VideoPreferenceScreen}
        options={{
          headerShown: false,
          orientation: 'portrait_up',
        }}
      />
      <Stack.Screen
        name="BlockedUsers"
        component={BlockedUsersScreen}
        options={{
          headerShown: false,
          orientation: 'portrait_up',
        }}
      />
    </Stack.Navigator>
  );
}
