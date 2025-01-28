import { UnistylesRegistry, UnistylesRuntime } from 'react-native-unistyles';
import { breakpoints } from './breakpoints';
import { darkTheme } from './theme';

export type BreakPoints = typeof breakpoints;

export interface AppTheme {
  dark: typeof darkTheme;
}

export function getAppTheme() {
  return UnistylesRuntime.getTheme() as AppTheme['dark'];
}

declare module 'react-native-unistyles' {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  export interface UnistylesBreakpoints extends BreakPoints {}
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  export interface UnistylesThemes extends AppTheme {}
}

UnistylesRegistry.addBreakpoints(breakpoints)
  .addThemes({
    dark: darkTheme,
  })
  .addConfig({
    adaptiveThemes: true,
  });
