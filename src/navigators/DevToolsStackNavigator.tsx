import { DiagnosticsScreen, NewRelicDemoScreen } from '@app/screens/DevTools';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StackScreenProps } from '@react-navigation/stack';

export type DevToolsParamList = {
  Diagnostics: undefined;
  NewRelicDemo: undefined;
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
        }}
      />
      <Stack.Screen
        name="NewRelicDemo"
        component={NewRelicDemoScreen}
        options={{
          headerShown: false,
        }}
      />
    </Stack.Navigator>
  );
}
