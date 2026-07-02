const tintColorLight = '#1083FE';
const tintColorDark = '#2E86FF';
const lightText = '#0F1620';
const darkText = '#EDF1F5';
const lightBackground = '#EBF0F6';
const darkBackground = '#0C1014';
const borderLight = 'rgba(16,30,50,0.10)';
const borderDark = 'rgba(255,255,255,0.10)';
const iconLight = '#54657A';
const iconDark = '#93A1B2';

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
