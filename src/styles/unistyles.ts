import { StyleSheet, UnistylesRuntime } from 'react-native-unistyles';
import { breakpoints } from './breakpoints';
import { darkTheme, lightTheme } from './themes';

export type BreakPoints = typeof breakpoints;

export interface AppTheme {
  'foam-dark': typeof darkTheme;
  'foam-light': typeof lightTheme;
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
    'foam-dark': darkTheme,
    'foam-light': lightTheme,
  },
  settings: {
    adaptiveThemes: true,
  },
});
