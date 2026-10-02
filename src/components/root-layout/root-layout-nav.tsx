import { SystemBars } from 'react-native-edge-to-edge';

import { DarkTheme, Stack, ThemeProvider } from 'expo-router';

import { ForceUpdateModal } from '@app/components/force-update-modal/force-update-modal';
import { OTAUpdates } from '@app/components/ota-updates/ota-updates';
import { useStartupMark } from '@app/hooks/use-startup-mark';
import { Providers } from '@app/providers/providers';
import { theme } from '@app/styles/themes';
import { nativeStackScreenOptions } from '@app/utils/navigation/native-stack-options';

import { RouterEffects } from './router-effects';

const navigationTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: theme.color.background.dark,
    border: theme.color.border.dark,
    card: theme.color.background.dark,
    primary: theme.colorPrimary,
    text: theme.color.text.dark,
  },
};

const rootStackScreens = [
  'index',
  'tabs',
  'streams',
  'chat',
  'auth',
  'preferences',
  'storybook',
  'other',
  'dev-tools',
] as const;

export function RootLayoutNav() {
  useStartupMark('root_layout_render');

  return (
    <ThemeProvider value={navigationTheme}>
      <Providers>
        <SystemBars style='light' />
        <RouterEffects />
        <ForceUpdateModal />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: {
              backgroundColor: theme.color.background.dark,
            },
          }}
        >
          {rootStackScreens.map(screenName => (
            <Stack.Screen key={screenName} name={screenName} />
          ))}
          <Stack.Screen
            name='category/[id]'
            options={{
              ...nativeStackScreenOptions,
              title: '',
              headerBackButtonDisplayMode: 'minimal',
            }}
          />
          <Stack.Screen
            name='auth-sheet'
            options={{
              presentation: 'formSheet',
              sheetGrabberVisible: true,
              sheetAllowedDetents: 'fitToContents',
              sheetCornerRadius: theme.radius.xl,
              contentStyle: {
                backgroundColor: theme.color.surface.dark,
              },
            }}
          />
          <Stack.Screen
            name='feedback'
            options={{
              presentation: 'formSheet',
              sheetGrabberVisible: true,
              sheetAllowedDetents: [0.85],
              sheetCornerRadius: theme.radius.xl,
              contentStyle: {
                backgroundColor: theme.color.surface.dark,
              },
            }}
          />
        </Stack>
        <OTAUpdates />
      </Providers>
    </ThemeProvider>
  );
}
