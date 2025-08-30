import { StyleSheet, UnistylesRuntime } from 'react-native-unistyles';
import { breakpoints } from './breakpoints';
import { darkTheme } from './themes';

export type BreakPoints = typeof breakpoints;

export interface AppTheme {
  dark: typeof darkTheme;
  // light: typeof lightTheme;
}

export function getAppTheme() {
  return UnistylesRuntime.getTheme();
}

declare module 'react-native-unistyles' {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  export interface UnistylesThemes extends AppTheme {}
}
StyleSheet.configure({
  themes: {
    dark: darkTheme,
    // light: lightTheme,
  },
  settings: {
    initialTheme: 'dark',
    adaptiveThemes: false,
  },
});
