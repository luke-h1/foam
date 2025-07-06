import {
  blackA,
  grayDark,
  blueDark,
  slateDark,
  red,
  limeDark,
  whiteA,
  purpleDarkA,
} from '@radix-ui/colors';

export type ThemeColor = keyof typeof colors;
export type FontSize = keyof typeof darkTheme.font.fontSize;
export type FontWeight = keyof typeof darkTheme.font.fontWeight;
export type Spacing = keyof typeof darkTheme.spacing;
export type Radii = keyof typeof darkTheme.radii;

const colors = {
  screen: slateDark.slate1,

  // brand
  brightPurple: purpleDarkA.purpleA10,

  // foreground
  foreground: grayDark.gray12,
  foregroundNeutral: grayDark.gray11,
  foregroundInverted: grayDark.gray1,
  foregroundAction: limeDark.lime5,

  // surface
  surface: grayDark.gray3,
  surfaceNeutral: grayDark.gray6,
  surfaceInverted: grayDark.gray12,
  surfaceHighContrast: grayDark.gray12,
  surfaceHover: grayDark.gray4,

  // border
  border: grayDark.gray7,
  borderFaint: grayDark.gray4,
  borderNeutral: slateDark.slate4,

  // under/out line
  underline: grayDark.gray7,
  outline: blueDark.blue11,

  // overlay
  overlay: blackA.blackA11,

  // error
  cherry: red.red5,

  error: red.red10,

  // success
  lime: limeDark.lime10,

  //
  text: whiteA.whiteA10,

  // custom

  /**
   * https://developer.apple.com/design/human-interface-guidelines/color/#iOS-iPadOS-system-colors
   */
  iOS_blue: '#007AFF',
} as const;

export const darkTheme = {
  colors,
  spacing: {
    xs: 2,
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    '2xl': 24,
    '3xl': 32,
    headerHeight: 56,
    tabBarHeight: 70,
  },
  timing: {
    quick: 300,
  },
  radii: {
    sm: 4,
    md: 6,
    lg: 10,
    xl: 14,
    xxl: 18,
  },
  font: {
    fontFamily: 'SFProRounded',
    fontWeight: {
      thin: 300,
      regular: 400,
      semiBold: 600,
      bold: 700,
    },
    fontSize: {
      xxs: 10,
      xs: 12,
      sm: 14,
      md: 16,
      lg: 18,
      xl: 20,
      '2xl': 22,
      '3xl': 24,
      '4xl': 26,
    },
  },
} as const;
