import { Color } from './pallete';

const tintColorLight = Color.violet[600];
const tintColorDark = '#1AC9A2';
const lightText = Color.zinc[950];
const darkText = Color.zinc[50];
const lightBackground = Color.zinc[50];
const darkBackground = '#000000';
const borderLight = `${Color.zinc[950]}20`;
const borderDark = `${Color.zinc[50]}20`;
const iconLight = Color.zinc[500];
const iconDark = Color.zinc[300];

export type ThemeColor =
  | 'accent'
  | 'amber'
  | 'black'
  | 'blue'
  | 'gray'
  | 'orange'
  | 'plum'
  | 'red'
  | 'teal'
  | 'violet';

export const colors = {
  dark: {
    background: darkBackground,
    border: borderDark,
    icon: iconDark,
    tabIconDefault: iconDark,
    tabIconSelected: tintColorDark,
    text: darkText,
    tint: tintColorDark,
  },
  light: {
    background: lightBackground,
    border: borderLight,
    icon: iconLight,
    tabIconDefault: iconLight,
    tabIconSelected: tintColorLight,
    text: lightText,
    tint: tintColorLight,
  },
} as const;
