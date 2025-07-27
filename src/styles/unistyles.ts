import { StyleSheet, UnistylesRuntime } from 'react-native-unistyles';
import { breakpoints } from './breakpoints';
import { darkTheme } from './theme';

export type BreakPoints = typeof breakpoints;

export interface AppTheme {
  dark: typeof darkTheme;
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
  },
  settings: {
    adaptiveThemes: false,
  },
});
