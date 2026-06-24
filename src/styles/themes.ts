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
// Sky-blue accents as { light, dark }. The flat legacy `colorX` tokens below
// read the dark value (they are consumed as plain strings); the full pair is
// exposed via theme.color.accent / accentPress for call sites that resolve with
// useColorScheme().
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
    // Accent takes white text in both themes.
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
    text: Color.zinc[50],
    textLow: Color.zinc[400],
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

const CANVAS = { light: '#EBF0F6', dark: '#0C1014' } as const;
const SURFACE = { light: '#FFFFFF', dark: '#161D26' } as const;
const SURFACE_SUNKEN = { light: '#DFE7F0', dark: '#070A0E' } as const;
const SURFACE_ELEVATED = { light: '#FFFFFF', dark: '#1B232E' } as const;
const SURFACE_PRESSED = { light: '#F2F6FA', dark: '#1A222C' } as const;

export const theme = {
  colorRed: semanticColorGroups.red.accent,
  colorWhite: semanticColorGroups.gray.text,
  colorBlack: semanticColorGroups.gray.bg,
  colorLightGreen: primaryAccentPress.dark,
  colorDarkGreen: primaryAccent.dark,
  colorPrimary: semanticColorGroups.accent.accent,
  colorPrimaryAlpha: semanticColorGroups.accent.accentAlpha,
  colorPrimaryHover: semanticColorGroups.accent.accentHover,
  colorPrimarySurface: semanticColorGroups.accent.bgAltAlpha,
  colorGrey: semanticColorGroups.gray.accent,
  colorGreyAlpha: semanticColorGroups.gray.accentAlpha,
  colorGreyHover: semanticColorGroups.gray.accentHover,
  colorGreyHoverAlpha: semanticColorGroups.gray.accentHoverAlpha,
  colorBlue: semanticColorGroups.blue.accent,
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

  // Sky-blue on slate. Every token is a { light, dark } pair, resolved at the
  // call site with theme.color.X[useColorScheme() ?? 'dark'].
  color: {
    reactBlue: {
      light: '#087EA4',
      dark: '#58C4DC',
    },
    transparent: {
      light: 'rgba(255,255,255,0)',
      dark: 'rgba(0,0,0,0)',
    },
    // Page background.
    canvas: CANVAS,
    background: {
      ...CANVAS,
      // Retained for existing call sites; mapped onto the new slate surfaces.
      darkAlt: SURFACE.dark,
      darkAltAlpha: 'rgba(22,29,38,0.92)',
    },
    // Raised surfaces (cards, sheets, inputs).
    surface: SURFACE,
    surfaceSunken: SURFACE_SUNKEN,
    surfaceElevated: SURFACE_ELEVATED,
    surfacePressed: SURFACE_PRESSED,
    rowAlt: {
      light: 'rgba(16,24,40,0.04)',
      dark: 'rgba(255,255,255,0.04)',
    },
    // Existing surface aliases re-pointed at the slate palette for coherence.
    backgroundSecondary: SURFACE,
    backgroundTertiary: SURFACE_SUNKEN,
    backgroundElement: SURFACE_PRESSED,
    text: {
      light: '#0F1620',
      dark: '#EDF1F5',
    },
    textSecondary: {
      light: '#54657A',
      dark: '#93A1B2',
    },
    textLow: {
      light: '#54657A',
      dark: '#93A1B2',
    },
    textFaint: {
      light: '#8896A8',
      dark: '#65717F',
    },
    border: {
      light: 'rgba(16,30,50,0.10)',
      dark: 'rgba(255,255,255,0.10)',
    },
    borderStrong: {
      light: 'rgba(16,30,50,0.16)',
      dark: 'rgba(255,255,255,0.16)',
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
    accentRing: {
      light: 'rgba(16,131,254,0.35)',
      dark: 'rgba(46,134,255,0.45)',
    },
    // Accent takes white text in both themes.
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
    // Twitch purple — chat links/mentions only.
    twitch: {
      light: '#8A4FE6',
      dark: '#A172F0',
    },
    twitchSurface: {
      light: 'rgba(138,79,230,0.10)',
      dark: 'rgba(161,114,240,0.16)',
    },
    surfaceNeutral: {
      light: '#FFFFFF',
      dark: '#1C1C1E',
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
    // Video chrome — dark in both themes.
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
  fontSize17: fontScale(17),
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
  borderRadius14: 14,
  borderRadius16: 16,
  borderRadius20: 20,
  borderRadius28: 28,
  borderRadius32: 32,
  borderRadius34: 34,
  borderRadius40: 40,
  borderRadius45: 45,
  borderRadius80: 80,
  borderRadius999: 999,

  // Retained for existing call sites (theme.dropShadow.boxShadow).
  dropShadow: {
    boxShadow: '0 24px 64px 0 rgba(0, 0, 0, 0.45)',
  },
  // Elevation scale, each a { light, dark } boxShadow pair resolved at the call
  // site with useColorScheme().
  shadow: {
    sm: {
      light: '0 1px 2px rgba(16,30,50,0.06)',
      dark: '0 1px 2px rgba(0,0,0,0.40)',
    },
    md: {
      light: '0 1px 2px rgba(16,30,50,0.05), 0 8px 24px rgba(16,30,50,0.08)',
      dark: '0 1px 2px rgba(0,0,0,0.40), 0 12px 30px rgba(0,0,0,0.45)',
    },
    lg: {
      light: '0 2px 6px rgba(16,30,50,0.06), 0 18px 44px rgba(16,30,50,0.13)',
      dark: '0 2px 6px rgba(0,0,0,0.45), 0 18px 40px rgba(0,0,0,0.55)',
    },
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
