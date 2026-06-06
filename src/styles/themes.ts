import * as Device from 'expo-device';
import { Color } from './pallete';

const SPACE_SCALE = 1.33;
const FONT_SCALE = 1.2;

const isIpad = Device.osName === 'iPadOS';

const spaceScale = (value: number) =>
  isIpad ? Math.round(value * SPACE_SCALE) : value;

const fontScale = (value: number) =>
  isIpad ? Math.round(value * FONT_SCALE) : value;

const alpha = (hex: string, opacityHex: string) => `${hex}${opacityHex}`;

export type Theme = 'foam-dark';

export const semanticColorGroups = {
  accent: {
    accent: Color.green[500],
    accentAlpha: alpha(Color.green[500], 'CC'),
    accentHover: Color.green[400],
    accentHoverAlpha: alpha(Color.green[400], 'CC'),
    bgAltAlpha: alpha(Color.green[500], '1A'),
    contrast: Color.zinc[950],
    ui: Color.green[500],
    uiAlpha: alpha(Color.green[500], '24'),
  },
  amber: {
    accent: Color.amber[400],
    accentAlpha: alpha(Color.amber[400], 'CC'),
  },
  black: {
    accentAlpha: alpha('#000000', 'CC'),
    bgAlpha: 'rgba(0, 0, 0, 0.72)',
    bgAltAlpha: 'rgba(0, 0, 0, 0.88)',
    borderHoverAlpha: 'rgba(255, 255, 255, 0.18)',
    uiActiveAlpha: 'rgba(255, 255, 255, 0.14)',
  },
  blue: {
    accent: Color.sky[400],
  },
  grass: {
    accent: Color.emerald[400],
    accentAlpha: alpha(Color.emerald[400], 'CC'),
  },
  gray: {
    accent: Color.zinc[300],
    accentAlpha: alpha(Color.zinc[300], 'B3'),
    accentHover: Color.zinc[200],
    accentHoverAlpha: alpha(Color.zinc[200], 'CC'),
    bg: '#000000',
    bgAlt: Color.zinc[950],
    bgAltAlpha: 'rgba(9, 9, 11, 0.88)',
    border: alpha(Color.zinc[50], '14'),
    borderAlpha: alpha(Color.zinc[50], '1F'),
    borderHover: alpha(Color.zinc[50], '2E'),
    borderUi: alpha(Color.zinc[50], '29'),
    contrast: Color.zinc[50],
    text: Color.zinc[50],
    textLow: Color.zinc[400],
    ui: Color.zinc[900],
    uiActive: Color.zinc[800],
    uiAlpha: alpha(Color.zinc[50], '0F'),
  },
  green: {
    accent: Color.green[400],
    uiAlpha: alpha(Color.green[500], '29'),
  },
  orange: {
    accent: Color.orange[400],
  },
  plum: {
    accent: Color.fuchsia[400],
    border: alpha(Color.zinc[50], '1A'),
  },
  red: {
    accent: Color.red[400],
    border: Color.red[500],
    borderAlpha: alpha(Color.red[500], '80'),
    borderUi: alpha(Color.red[500], '66'),
    uiAlpha: alpha(Color.red[500], '1F'),
  },
  teal: {
    accent: Color.teal[400],
  },
  violet: {
    accent: Color.violet[400],
    ui: alpha(Color.violet[500], '1A'),
  },
} as const;

export const theme = {
  colorRed: semanticColorGroups.red.accent,
  colorWhite: semanticColorGroups.gray.text,
  colorBlack: semanticColorGroups.gray.bg,
  colorLightGreen: semanticColorGroups.accent.accentHover,
  colorDarkGreen: semanticColorGroups.accent.accent,
  colorGrey: semanticColorGroups.gray.accent,
  colorGreyAlpha: semanticColorGroups.gray.accentAlpha,
  colorGreyHover: semanticColorGroups.gray.accentHover,
  colorGreyHoverAlpha: semanticColorGroups.gray.accentHoverAlpha,
  colorBlue: semanticColorGroups.blue.accent,
  colorGrass: semanticColorGroups.grass.accent,
  colorGrassAlpha: semanticColorGroups.grass.accentAlpha,
  colorGreen: semanticColorGroups.green.accent,
  colorGreenSurface: semanticColorGroups.green.uiAlpha,
  colorOrange: semanticColorGroups.orange.accent,
  colorPlum: semanticColorGroups.plum.accent,
  colorPlumBorder: semanticColorGroups.plum.border,
  colorTeal: semanticColorGroups.teal.accent,
  colorViolet: semanticColorGroups.violet.accent,
  colorVioletSurface: semanticColorGroups.violet.ui,
  colorAmber: semanticColorGroups.amber.accent,
  colorAmberAlpha: semanticColorGroups.amber.accentAlpha,
  colorAccentAlpha: semanticColorGroups.accent.accentAlpha,
  colorAccentHoverAlpha: semanticColorGroups.accent.accentHoverAlpha,
  colorAccentSurface: semanticColorGroups.accent.bgAltAlpha,
  colorRedBorder: semanticColorGroups.red.border,
  colorRedBorderAlpha: semanticColorGroups.red.borderAlpha,
  colorRedBorderUi: semanticColorGroups.red.borderUi,
  colorRedSurface: semanticColorGroups.red.uiAlpha,
  colorBlackAlpha: semanticColorGroups.black.accentAlpha,
  colorBlackOverlay: semanticColorGroups.black.bgAlpha,
  colorBlackOverlayStrong: semanticColorGroups.black.bgAltAlpha,
  colorBlackBorderHover: semanticColorGroups.black.borderHoverAlpha,
  colorBlackActiveContent: semanticColorGroups.black.uiActiveAlpha,
  colorBackgroundTertiaryAlpha: semanticColorGroups.gray.bgAltAlpha,
  colorBorderSecondary: semanticColorGroups.gray.borderAlpha,
  colorBorderHover: semanticColorGroups.gray.borderHover,
  colorBorderTertiary: semanticColorGroups.gray.borderUi,
  colorSurfaceAlpha: semanticColorGroups.gray.uiAlpha,

  color: {
    reactBlue: {
      light: '#087EA4',
      dark: '#58C4DC',
    },
    transparent: {
      light: 'rgba(255,255,255,0)',
      dark: 'rgba(0,0,0,0)',
    },
    text: {
      light: '#121212',
      dark: semanticColorGroups.gray.text,
    },
    textSecondary: {
      light: '#606060',
      dark: semanticColorGroups.gray.textLow,
    },
    background: {
      light: '#FFFFFF',
      dark: semanticColorGroups.gray.bg,
      darkAlt: semanticColorGroups.gray.bgAlt,
      darkAltAlpha: semanticColorGroups.gray.bgAltAlpha,
    },
    backgroundSecondary: {
      light: '#f1f1f1',
      dark: semanticColorGroups.gray.ui,
    },
    backgroundTertiary: {
      light: '#f5f5f5',
      dark: semanticColorGroups.gray.bgAlt,
    },
    backgroundElement: {
      light: '#F1F1F1',
      dark: semanticColorGroups.gray.uiActive,
    },
    border: {
      light: '#D9D9D0',
      dark: semanticColorGroups.gray.border,
    },
  },

  darkActiveContent: semanticColorGroups.gray.uiAlpha,
  lightActiveContent: 'rgba(0,0,0, 0.1)',

  space2: spaceScale(2),
  space4: spaceScale(4),
  space8: spaceScale(8),
  space12: spaceScale(12),
  space16: spaceScale(16),
  space20: spaceScale(20),
  space24: spaceScale(24),
  space28: spaceScale(28),
  space36: spaceScale(36),
  space44: spaceScale(44),
  space56: spaceScale(56),
  space72: spaceScale(72),
  space84: spaceScale(84),
  tabBarHeight: spaceScale(84),

  fontSize10: fontScale(10),
  fontSize11: fontScale(11),
  fontSize12: fontScale(12),
  fontSize14: fontScale(14),
  fontSize16: fontScale(16),
  fontSize18: fontScale(18),
  fontSize20: fontScale(20),
  fontSize24: fontScale(24),
  fontSize28: fontScale(28),
  fontSize32: fontScale(32),
  fontSize34: fontScale(34),
  fontSize42: fontScale(42),

  fontFamilyLight: 'Montserrat_300Light',
  fontFamilyLightItalic: 'Montserrat_300Light_Italic',

  fontFamily: 'Montserrat_500Medium',
  fontFamilyItalic: 'Montserrat_500Medium_Italic',

  fontFamilySemiBold: 'Montserrat_600SemiBold',
  fontFamilySemiBoldItalic: 'Montserrat_600SemiBold_Italic',

  fontFamilyBold: 'Montserrat_700Bold',
  fontFamilyBoldItalic: 'Montserrat_700Bold_Italic',
  fontFamilyHeavy: 'Montserrat_800ExtraBold',
  fontFamilyHeavyItalic: 'Montserrat_800ExtraBold_Italic',
  fontFamilyBlack: 'Montserrat_900Black',
  fontFamilyBlackItalic: 'Montserrat_900Black_Italic',
  fontFamilyRegular: 'Montserrat_400Regular',
  fontFamilyRegularItalic: 'Montserrat_400Regular_Italic',

  borderRadius4: 4,
  borderRadius6: 6,
  borderRadius10: 10,
  borderRadius12: 12,
  borderRadius16: 16,
  borderRadius20: 20,
  borderRadius28: 28,
  borderRadius32: 32,
  borderRadius34: 34,
  borderRadius40: 40,
  borderRadius45: 45,
  borderRadius80: 80,
  borderRadius999: 999,

  dropShadow: {
    boxShadow: '0 24px 64px 0 rgba(0, 0, 0, 0.45)',
  },
} as const;

export type AppTheme = typeof theme;
export type ThemeColor = keyof typeof semanticColorGroups;
type ThemeColorGroup = (typeof semanticColorGroups)[ThemeColor];
type ThemeColorValue = ThemeColor | ThemeColorToken;
export type ThemeColorToken = {
  [Group in ThemeColor]: `${Group}.${Extract<
    keyof (typeof semanticColorGroups)[Group],
    string
  >}`;
}[ThemeColor];

function isThemeColorToken(color: ThemeColorValue): color is ThemeColorToken {
  return color.includes('.');
}

function getThemeColorGroup(color: ThemeColor): ThemeColorGroup {
  return semanticColorGroups[color];
}

function getThemeColorGroupValue(group: ThemeColorGroup, token: string) {
  return group[token as keyof typeof group];
}

export function resolveThemeColor(
  color: ThemeColorValue,
  options?: {
    contrast?: boolean;
    highContrast?: boolean;
  },
): string {
  if (isThemeColorToken(color)) {
    const [groupName, tokenName] = color.split('.') as [ThemeColor, string];
    const group = getThemeColorGroup(groupName);

    return (
      getThemeColorGroupValue(group, tokenName) ?? semanticColorGroups.gray.text
    );
  }

  const group = getThemeColorGroup(color);
  const resolvedHighContrast = options?.highContrast ?? color === 'gray';
  const contrast = getThemeColorGroupValue(group, 'contrast');
  const text = getThemeColorGroupValue(group, 'text');
  const textLow = getThemeColorGroupValue(group, 'textLow');
  const accent = getThemeColorGroupValue(group, 'accent');

  if (options?.contrast && contrast) {
    return contrast;
  }

  if (resolvedHighContrast && text) {
    return text;
  }

  return textLow ?? text ?? accent ?? contrast ?? semanticColorGroups.gray.text;
}
