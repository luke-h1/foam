import { ScreenSuspense } from '@app/components/ScreenSuspense';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StackScreenProps } from '@react-navigation/stack';
import { lazy } from 'react';

const LazyDebugScreen = lazy(() =>
  import('@app/screens/DevTools/DebugScreen').then(m => ({
    default: m.DebugScreen,
  })),
);
const LazySentryDemoScreen = lazy(() =>
  import('@app/screens/DevTools/SentryDemoScreen').then(m => ({
    default: m.SentryDemoScreen,
  })),
);
const LazyDiagnosticsScreen = lazy(() =>
  import('@app/screens/DevTools/components/Diagnostics').then(m => ({
    default: m.Diagnostics,
  })),
);

function DebugScreen() {
  return (
    <ScreenSuspense>
      <LazyDebugScreen />
    </ScreenSuspense>
  );
}

function SentryDemoScreen() {
  return (
    <ScreenSuspense>
      <LazySentryDemoScreen />
    </ScreenSuspense>
  );
}

function DiagnosticsScreen() {
  return (
    <ScreenSuspense>
      <LazyDiagnosticsScreen />
    </ScreenSuspense>
  );
}

export type DevToolsParamList = {
  Diagnostics: undefined;
  SentryDemo: undefined;
  Debug: undefined;
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
    </Stack.Navigator>
  );
}
