const tintColorLight = '#1083FE';
const tintColorDark = '#2E86FF';
const lightText = '#000000';
const darkText = '#F5F5F7';
const lightBackground = '#F2F2F7';
const darkBackground = '#000000';
const borderLight = 'rgba(60,60,67,0.18)';
const borderDark = 'rgba(255,255,255,0.10)';
const iconLight = '#6C6C70';
const iconDark = '#98989F';

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
