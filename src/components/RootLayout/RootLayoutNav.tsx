import { ForceUpdateModal } from '@app/components/ForceUpdateModal/ForceUpdateModal';
import { useOTAUpdates } from '@app/hooks/useOTAUpdates';
import { Providers } from '@app/Providers/Providers';
import { theme } from '@app/styles/themes';
import { isLiquidGlassAvailable } from 'expo-glass-effect';
import { StatusBar } from 'expo-status-bar';
import { DarkTheme, Stack, ThemeProvider } from 'expo-router';
import { RouterEffects } from './RouterEffects';

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
  useOTAUpdates();

  return (
    <ThemeProvider
      value={{
        ...DarkTheme,
        colors: {
          ...DarkTheme.colors,
          background: theme.color.background.dark,
          border: theme.color.border.dark,
          card: theme.color.background.dark,
          primary: theme.colorPrimary,
          text: theme.color.text.dark,
        },
      }}
    >
      <Providers>
        <StatusBar style='light' />
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
            name='auth-sheet'
            options={{
              presentation: 'formSheet',
              sheetGrabberVisible: true,
              sheetAllowedDetents: [0.85],
              sheetCornerRadius: theme.borderRadius28,
              contentStyle: {
                backgroundColor: isLiquidGlassAvailable()
                  ? theme.color.transparent.dark
                  : theme.color.background.dark,
              },
            }}
          />
        </Stack>
      </Providers>
    </ThemeProvider>
  );
}
