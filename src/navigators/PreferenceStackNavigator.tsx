import { ChatPreferenceScreen } from '@app/screens/Preferences/ChatPreferenceScreen';
import { ThemePreferenceScreen } from '@app/screens/Preferences/ThemePreferenceScreen';
import { VideoPreferenceScreen } from '@app/screens/Preferences/VideoPreferenceScreen';
import { BlockedUsersScreen } from '@app/screens/Preferences/BlockedUsersScreen';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StackScreenProps } from '@react-navigation/stack';

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
