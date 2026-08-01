import { ReactNode, type Ref } from 'react';
import {
  StyleSheet,
  // eslint-disable-next-line no-restricted-imports
  Text as RNText,
  // eslint-disable-next-line no-restricted-imports
  TextProps as RNTextProps,
  TextStyle,
} from 'react-native';

import { getMargin, MarginProps } from '@app/styles/spacing';
import {
  resolveThemeColor,
  theme,
  type ThemeColor,
  type ThemeColorToken,
} from '@app/styles/themes';

export type TextType =
  | 'default'
  | 'base'
  | 'xxxs'
  | 'xxs'
  | 'xs'
  | 'sm'
  | 'md'
  | 'lg'
  | 'xl'
  | '2xl'
  | '3xl'
  | '4xl'
  | '5xl'
  | '6xl'
  | '7xl'
  | '8xl'
  | '9xl'
  | '10xl'
  | '11xl'
  | '12xl'
  | 'title'
  | 'subtitle'
  | 'link'
  | 'body'
  | 'caption';

export type TextWeight =
  | 'ultralight'
  | 'thin'
  | 'light'
  | 'normal'
  | 'medium'
  | 'semibold'
  | 'bold'
  | 'heavy'
  | 'black';

export type TextVariant = 'default' | 'mono';
type AppFontVariant = TextVariant | 'display';

export type TextFamily = 'brand' | 'system';

export interface TextProps extends RNTextProps, MarginProps {
  ref?: Ref<RNText>;
  children?: ReactNode;
  type?: TextType;
  weight?: TextWeight;
  variant?: AppFontVariant;
  family?: TextFamily;
  color?: ThemeColor | ThemeColorToken;
  contrast?: boolean;
  highContrast?: boolean;
  italic?: boolean;
  tabular?: boolean;
  align?: 'left' | 'center' | 'right';
}

const margin = getMargin(theme);

const italicFontMap: Record<TextWeight, string> = {
  ultralight: theme.fontFamilyLightItalic,
  thin: theme.fontFamilyLightItalic,
  light: theme.fontFamilyLightItalic,
  normal: theme.fontFamilyRegularItalic,
  medium: theme.fontFamilyItalic,
  semibold: theme.fontFamilySemiBoldItalic,
  bold: theme.fontFamilyBoldItalic,
  heavy: theme.fontFamilyHeavyItalic,
  black: theme.fontFamilyBlackItalic,
};

const uprightFontMap: Record<TextWeight, string> = {
  ultralight: theme.fontFamilyLight,
  thin: theme.fontFamilyLight,
  light: theme.fontFamilyLight,
  normal: theme.fontFamilyRegular,
  medium: theme.fontFamily,
  semibold: theme.fontFamilySemiBold,
  bold: theme.fontFamilyBold,
  heavy: theme.fontFamilyHeavy,
  black: theme.fontFamilyBlack,
};

const fontWeightToTextWeight: Record<string, TextWeight> = {
  '100': 'ultralight',
  '200': 'thin',
  '300': 'light',
  '400': 'normal',
  '500': 'medium',
  '600': 'semibold',
  '700': 'bold',
  '800': 'heavy',
  '900': 'black',
  bold: 'bold',
  normal: 'normal',
};

/**
 * Fixed-weight font files ignore `fontWeight` on iOS, so style weights map
 * to the theme token whose family renders them.
 */
// eslint-disable-next-line react-doctor/only-export-components -- pure weight resolver exercised directly by tests
export function resolveWeightFromFontWeight(
  fontWeight: TextStyle['fontWeight'] | number,
): TextWeight | undefined {
  if (fontWeight == null) {
    return undefined;
  }

  const direct = fontWeightToTextWeight[String(fontWeight)];
  if (direct) {
    return direct;
  }

  const numeric = Number(fontWeight);
  if (Number.isNaN(numeric)) {
    return undefined;
  }

  const clamped = Math.min(900, Math.max(100, Math.round(numeric / 100) * 100));
  return fontWeightToTextWeight[String(clamped)];
}

const weightMap: Record<TextWeight, TextStyle['fontWeight']> = {
  black: '900',
  bold: '700',
  heavy: '800',
  light: '300',
  medium: '500',
  normal: '400',
  semibold: '600',
  thin: '200',
  ultralight: '100',
};

const sizeStyles = StyleSheet.create({
  '10xl': { fontSize: 128, lineHeight: 154 },
  '11xl': { fontSize: 160, lineHeight: 192 },
  '12xl': { fontSize: 192, lineHeight: 230 },
  '2xl': { fontSize: 24, lineHeight: 32 },
  '3xl': { fontSize: 28, lineHeight: 36 },
  '4xl': { fontSize: 32, lineHeight: 44 },
  '5xl': { fontSize: 36, lineHeight: 48 },
  '6xl': { fontSize: 48, lineHeight: 58 },
  '7xl': { fontSize: 60, lineHeight: 72 },
  '8xl': { fontSize: 72, lineHeight: 86 },
  '9xl': { fontSize: 96, lineHeight: 116 },
  base: { fontSize: 16, lineHeight: 24 },
  body: { fontSize: 14, lineHeight: 20 },
  caption: { fontSize: 12, lineHeight: 16 },
  default: { fontSize: 16, lineHeight: 24 },
  lg: { fontSize: 20, lineHeight: 28 },
  link: { fontSize: 16, lineHeight: 24 },
  md: { fontSize: 18, lineHeight: 28 },
  sm: { fontSize: 16, lineHeight: 24 },
  subtitle: { fontSize: 20, lineHeight: 28 },
  title: { fontSize: 32, lineHeight: 40 },
  xl: { fontSize: 22, lineHeight: 28 },
  xs: { fontSize: 14, lineHeight: 20 },
  xxs: { fontSize: 12, lineHeight: 16 },
  xxxs: { fontSize: 10, lineHeight: 14 },
});

export function Text({
  type = 'default',
  weight = 'normal',
  variant = 'default',
  family = 'brand',
  color = 'gray',
  contrast,
  highContrast,
  italic,
  tabular,
  align = 'left',
  children,
  style,
  ref,
  m,
  mb,
  ml,
  mr,
  mt,
  mx,
  my,
  maxFontSizeMultiplier = 2,
  ...props
}: TextProps) {
  const effectiveContrast =
    contrast === undefined ? color === 'gray' : contrast;
  const resolvedColor = resolveThemeColor(color, {
    contrast: effectiveContrast,
    highContrast,
  });

  const sizeStyle = sizeStyles[type];

  const isSystemFamily = family === 'system' && variant === 'default';
  const isBrandFamily = family === 'brand' && variant === 'default';
  const flattenedStyle = StyleSheet.flatten(style);
  const styleWeight = isBrandFamily
    ? resolveWeightFromFontWeight(flattenedStyle?.fontWeight)
    : undefined;

  const resolvedFontFamily = isSystemFamily
    ? undefined
    : getFontFamily(variant, weight, italic);

  const textStyle: TextStyle = {
    ...margin({ m, mb, ml, mr, mt, mx, my }),
    color: resolvedColor,
    fontFamily: resolvedFontFamily,
    fontStyle:
      (variant === 'mono' || isSystemFamily) && italic ? 'italic' : 'normal',
    fontVariant: tabular ? ['tabular-nums'] : undefined,
    fontWeight:
      variant === 'mono' || isSystemFamily ? weightMap[weight] : undefined,
    textAlign: align,
  };

  const styleWeightOverride: TextStyle | null = styleWeight
    ? {
        fontFamily: getFontFamily('default', styleWeight, italic),
        fontWeight: undefined,
      }
    : null;

  return (
    <RNText
      ref={ref}
      textBreakStrategy='simple'
      maxFontSizeMultiplier={maxFontSizeMultiplier}
      {...props}
      style={[sizeStyle, textStyle, style, styleWeightOverride]}
    >
      {children}
    </RNText>
  );
}

function getFontFamily(
  variant: AppFontVariant,
  weight: TextWeight,
  italic?: boolean,
): string | undefined {
  if (variant === 'mono') {
    return 'monospace';
  }

  if (variant === 'display') {
    return italic
      ? 'InstrumentSerif_400Regular_Italic'
      : 'InstrumentSerif_400Regular';
  }

  return italic ? italicFontMap[weight] : uprightFontMap[weight];
}
