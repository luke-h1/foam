import { Platform } from 'react-native';

import * as Device from 'expo-device';

import { Color } from './palette';

const SPACE_SCALE = 1.4;
const FONT_SCALE = 1.4;

/**
 * iOS resolves the fonts embedded by the expo-font config plugin by PostScript
 * name; Android and web register them under the file name.
 */
const fontFamilyFor = (fileName: string, postScriptName: string) =>
  Platform.OS === 'ios' ? postScriptName : fileName;

const isIpad = Device.osName === 'iPadOS';

const spaceScale = (value: number) =>
  isIpad ? Math.round(value * SPACE_SCALE) : value;

const fontScale = (value: number) =>
  isIpad ? Math.round(value * FONT_SCALE) : value;

const alpha = (hex: string, opacityHex: string) => `${hex}${opacityHex}`;
const primaryAccent = { light: '#1083FE', dark: '#2E86FF' } as const;
const primaryAccentPress = { light: '#0A6CE0', dark: '#5AA1FF' } as const;

export type Theme = 'foam-dark';

export const semanticColorGroups = {
  accent: {
    accent: primaryAccent.dark,
    accentAlpha: alpha(primaryAccent.dark, 'CC'),
    accentHover: primaryAccentPress.dark,
    accentHoverAlpha: alpha(primaryAccentPress.dark, 'CC'),
    bgAltAlpha: alpha(primaryAccent.dark, '1A'),
    contrast: '#FFFFFF',
    ui: primaryAccent.dark,
    uiAlpha: alpha(primaryAccent.dark, '24'),
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
    text: '#F5F5F7',
    textLow: '#98989F',
    ui: Color.zinc[900],
    uiActive: Color.zinc[800],
    uiAlpha: alpha(Color.zinc[50], '0F'),
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

/**
 * One neutral grey family, taken from the iOS dark system backgrounds, so the
 * React Native surfaces match the native forms, sheets and tab bar beside them.
 */
const CANVAS = { light: '#F2F2F7', dark: '#000000' } as const;
const SURFACE = { light: '#FFFFFF', dark: '#1C1C1E' } as const;
const SURFACE_SUNKEN = { light: '#E5E5EA', dark: '#0A0A0B' } as const;
const SURFACE_ELEVATED = { light: '#FFFFFF', dark: '#2C2C2E' } as const;
const SURFACE_PRESSED = { light: '#E5E5EA', dark: '#2C2C2E' } as const;

export const theme = {
  colorRed: semanticColorGroups.red.accent,
  colorWhite: semanticColorGroups.gray.text,
  colorBlack: semanticColorGroups.gray.bg,
  colorPrimary: semanticColorGroups.accent.accent,
  /**
   * Android paints `selectionColor` behind the glyphs, so keep it translucent (0x66 = 40%) or selected text is unreadable.
   */
  colorTextSelection: alpha(primaryAccent.dark, '66'),
  colorGrey: semanticColorGroups.gray.accent,
  colorGreyAlpha: semanticColorGroups.gray.accentAlpha,
  colorGreyHoverAlpha: semanticColorGroups.gray.accentHoverAlpha,
  colorBlue: semanticColorGroups.blue.accent,
  colorOrange: semanticColorGroups.orange.accent,
  colorPlum: semanticColorGroups.plum.accent,
  colorTeal: semanticColorGroups.teal.accent,
  colorViolet: semanticColorGroups.violet.accent,
  colorAmber: semanticColorGroups.amber.accent,
  colorAmberAlpha: semanticColorGroups.amber.accentAlpha,
  colorAccentAlpha: semanticColorGroups.accent.accentAlpha,
  colorAccentSurface: semanticColorGroups.accent.bgAltAlpha,
  colorRedSurface: semanticColorGroups.red.uiAlpha,
  colorBlackOverlay: semanticColorGroups.black.bgAlpha,
  colorBlackActiveContent: semanticColorGroups.black.uiActiveAlpha,
  colorBorderSecondary: semanticColorGroups.gray.borderAlpha,
  colorSurfaceAlpha: semanticColorGroups.gray.uiAlpha,

  color: {
    background: {
      ...CANVAS,
      darkAlt: SURFACE.dark,
      darkAltAlpha: 'rgba(28,28,30,0.92)',
    },
    surface: SURFACE,
    surfaceElevated: SURFACE_ELEVATED,
    surfacePressed: SURFACE_PRESSED,
    backgroundSecondary: SURFACE,
    backgroundTertiary: SURFACE_SUNKEN,
    backgroundElement: SURFACE_PRESSED,
    text: {
      light: '#000000',
      dark: '#F5F5F7',
    },
    textSecondary: {
      light: '#6C6C70',
      dark: '#98989F',
    },
    textFaint: {
      light: '#8E8E93',
      dark: '#6C6C70',
    },
    border: {
      light: 'rgba(60,60,67,0.18)',
      dark: 'rgba(255,255,255,0.10)',
    },
    accent: {
      light: '#1083FE',
      dark: '#2E86FF',
    },
    accentPress: {
      light: '#0A6CE0',
      dark: '#5AA1FF',
    },
    accentSurface: {
      light: 'rgba(16,131,254,0.10)',
      dark: 'rgba(46,134,255,0.16)',
    },
    onAccent: {
      light: '#FFFFFF',
      dark: '#FFFFFF',
    },
    live: {
      light: '#E5484D',
      dark: '#FF6166',
    },
    success: {
      light: '#1E9C6B',
      dark: '#38C08A',
    },
    warning: {
      light: '#C8851A',
      dark: '#E0A33A',
    },
    danger: {
      light: '#DC4B4B',
      dark: '#FF6B6B',
    },
    surfaceNeutral: {
      light: '#FFFFFF',
      dark: '#1C1C1E',
    },
    menu: {
      background: '#0A0A0B',
      header: '#0E0E10',
      card: '#1C1C1E',
      cardActive: '#2C2C2E',
      border: 'rgba(255, 255, 255, 0.075)',
      borderActive: 'rgba(255, 255, 255, 0.18)',
    },
    brand: {
      twitch: '#9147FF',
      twitchLight: '#A970FF',
      twitchBorder: '#BF94FF',
    },
    notice: {
      announcement: '#EB0400',
      muted: '#ADADB8',
      subscription: '#FFD700',
      charity: '#00AD03',
      blue: '#1475E1',
      orange: '#FF6905',
    },
    chatSample: {
      blue: '#1E90FF',
      green: '#3CB371',
      purple: Color.purple[400],
      amber: Color.amber[500],
    },
    scrim: {
      light: 'rgba(0,0,0,0.60)',
      dark: 'rgba(0,0,0,0.62)',
    },
    scrimStrong: {
      light: 'rgba(0,0,0,0.78)',
      dark: 'rgba(0,0,0,0.82)',
    },
  },

  darkActiveContent: semanticColorGroups.gray.uiAlpha,

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

  /**
   * Scales a font size up on iPad. The `Text` type ramp is built with it.
   */
  fontScale,

  fontSize11: fontScale(11),
  fontSize12: fontScale(12),
  fontSize14: fontScale(14),
  fontSize16: fontScale(16),
  fontSize17: fontScale(17),
  fontSize18: fontScale(18),
  fontSize20: fontScale(20),

  fontFamilyLight: fontFamilyFor('Montserrat_300Light', 'Montserrat-Light'),
  fontFamilyLightItalic: fontFamilyFor(
    'Montserrat_300Light_Italic',
    'Montserrat-LightItalic',
  ),

  fontFamily: fontFamilyFor('Montserrat_500Medium', 'Montserrat-Medium'),
  fontFamilyItalic: fontFamilyFor(
    'Montserrat_500Medium_Italic',
    'Montserrat-MediumItalic',
  ),

  fontFamilySemiBold: fontFamilyFor(
    'Montserrat_600SemiBold',
    'Montserrat-SemiBold',
  ),
  fontFamilySemiBoldItalic: fontFamilyFor(
    'Montserrat_600SemiBold_Italic',
    'Montserrat-SemiBoldItalic',
  ),

  fontFamilyBold: fontFamilyFor('Montserrat_700Bold', 'Montserrat-Bold'),
  fontFamilyBoldItalic: fontFamilyFor(
    'Montserrat_700Bold_Italic',
    'Montserrat-BoldItalic',
  ),
  fontFamilyHeavy: fontFamilyFor(
    'Montserrat_800ExtraBold',
    'Montserrat-ExtraBold',
  ),
  fontFamilyHeavyItalic: fontFamilyFor(
    'Montserrat_800ExtraBold_Italic',
    'Montserrat-ExtraBoldItalic',
  ),
  fontFamilyBlack: fontFamilyFor('Montserrat_900Black', 'Montserrat-Black'),
  fontFamilyBlackItalic: fontFamilyFor(
    'Montserrat_900Black_Italic',
    'Montserrat-BlackItalic',
  ),
  fontFamilyRegular: fontFamilyFor(
    'Montserrat_400Regular',
    'Montserrat-Regular',
  ),
  fontFamilyRegularItalic: fontFamilyFor(
    'Montserrat_400Regular_Italic',
    'Montserrat-Italic',
  ),

  /**
   * Corner radii: `sm` for badges and small chips, `md` for thumbnails and
   * controls, `lg` for cards and tiles, `xl` for sheets and `full` for pill
   * buttons and avatars. Pair each with `borderCurve: 'continuous'`.
   */
  radius: {
    sm: 6,
    md: 12,
    lg: 16,
    xl: 28,
    full: 999,
  },

  /**
   * Shadow for UI that floats over content, such as banners, floating buttons
   * and toasts. Lists, rows and cards have no shadow.
   */
  elevation: {
    floating: '0 8px 24px rgba(0, 0, 0, 0.5)',
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
  const values: Partial<Record<string, string>> = group;
  return values[token];
}

export function resolveThemeColor(
  color: ThemeColorValue,
  options?: {
    contrast?: boolean;
    highContrast?: boolean;
  },
): string {
  if (isThemeColorToken(color)) {
    // SAFETY: ThemeColorToken is built as `${ThemeColor}.${key}`, and no key contains a dot.
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
