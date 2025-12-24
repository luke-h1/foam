import { ChatScreen } from '@app/screens/ChatScreen/ChatScreen';
import { DebugScreen } from '@app/screens/DevTools/DebugScreen';
import { SentryDemoScreen } from '@app/screens/DevTools/SentryDemoScreen';
import { Diagnostics as DiagnosticsScreen } from '@app/screens/DevTools/components/Diagnostics';
import { StorybookScreen } from '@app/screens/StorybookScreen/StorybookScreen';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StackScreenProps } from '@react-navigation/stack';

export type DevToolsParamList = {
  Diagnostics: undefined;
  SentryDemo: undefined;
  Debug: undefined;
  Storybook: undefined;
  Chat: { channelName: string; channelId: string };
};

const Stack = createNativeStackNavigator<DevToolsParamList>();

export type DevToolsStackScreenProps<T extends keyof DevToolsParamList> =
  StackScreenProps<DevToolsParamList, T>;

export function DevToolsStackNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="Diagnostics"
        component={DiagnosticsScreen}
        options={{
          headerShown: false,
          orientation: 'portrait_up',
          presentation: 'modal',
        }}
      />
      <Stack.Screen
        name="SentryDemo"
        component={SentryDemoScreen}
        options={{
          headerShown: false,
          orientation: 'portrait_up',
        }}
      />
      <Stack.Screen
        name="Debug"
        component={DebugScreen}
        options={{
          headerShown: false,
          orientation: 'portrait_up',
        }}
      />
      <Stack.Screen
        name="Chat"
        component={ChatScreen}
        options={{
          headerShown: false,
          orientation: 'portrait_up',
        }}
      />
      <Stack.Screen
        name="Storybook"
        component={StorybookScreen}
        options={{
          headerShown: false,
          orientation: 'portrait_up',
        }}
      />
    </Stack.Navigator>
  );
}
