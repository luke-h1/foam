import { useColorScheme } from 'react-native';
import { SystemBars } from 'react-native-edge-to-edge';

import { isLiquidGlassAvailable } from 'expo-glass-effect';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';

import { ForceUpdateModal } from '@app/components/ForceUpdateModal/ForceUpdateModal';
import { OTAUpdates } from '@app/components/OTAUpdates/OTAUpdates';
import { Providers } from '@app/Providers/Providers';
import { theme } from '@app/styles/themes';

import { RouterEffects } from './RouterEffects';

const navigationThemes = {
  light: {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      background: theme.color.background.light,
      border: theme.color.border.light,
      card: theme.color.background.light,
      primary: theme.color.accent.light,
      text: theme.color.text.light,
    },
  },
  dark: {
    ...DarkTheme,
    colors: {
      ...DarkTheme.colors,
      background: theme.color.background.dark,
      border: theme.color.border.dark,
      card: theme.color.background.dark,
      primary: theme.color.accent.dark,
      text: theme.color.text.dark,
    },
  },
} as const;

const rootStackScreens = [
  'index',
  'tabs',
  'streams',
  'category/[id]',
  'chat',
  'auth',
  'preferences',
  'storybook',
  'other',
  'dev-tools',
] as const;

export function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const scheme = colorScheme === 'light' ? 'light' : 'dark';
  return (
    <ThemeProvider value={navigationThemes[scheme]}>
      <Providers>
        <SystemBars style={scheme === 'dark' ? 'light' : 'dark'} />
        <RouterEffects />
        <ForceUpdateModal />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: {
              backgroundColor: theme.color.background[scheme],
            },
          }}
        >
          {rootStackScreens.map(screenName => (
            <Stack.Screen key={screenName} name={screenName} />
          ))}
          <Stack.Screen
            name='auth-sheet'
            options={{
              presentation: 'formSheet',
              sheetGrabberVisible: true,
              sheetAllowedDetents: [0.85],
              sheetCornerRadius: theme.borderRadius28,
              contentStyle: {
                backgroundColor: isLiquidGlassAvailable()
                  ? theme.color.transparent[scheme]
                  : theme.color.background[scheme],
              },
            }}
          />
          <Stack.Screen
            name='feedback'
            options={{
              presentation: 'formSheet',
              sheetGrabberVisible: true,
              sheetAllowedDetents: [0.85],
              sheetCornerRadius: theme.borderRadius28,
              contentStyle: {
                backgroundColor: theme.color.background[scheme],
              },
            }}
          />
        </Stack>
        <OTAUpdates />
      </Providers>
    </ThemeProvider>
  );
}
