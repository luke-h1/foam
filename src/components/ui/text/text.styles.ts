import { StyleSheet, type TextStyle } from 'react-native';

import { theme } from '@app/styles/themes';

import type {
  TextFamily,
  TextProps,
  TextType,
  TextVariant,
  TextWeight,
} from './text';

const fontScale = theme.fontScale;

export const sizeStyles = StyleSheet.create({
  largeTitle: {
    fontSize: fontScale(34),
    letterSpacing: -0.4,
    lineHeight: fontScale(41),
  },
  title1: {
    fontSize: fontScale(28),
    letterSpacing: -0.3,
    lineHeight: fontScale(34),
  },
  title2: {
    fontSize: fontScale(22),
    letterSpacing: -0.2,
    lineHeight: fontScale(28),
  },
  title3: { fontSize: fontScale(20), lineHeight: fontScale(25) },
  headline: { fontSize: fontScale(17), lineHeight: fontScale(22) },
  body: { fontSize: fontScale(17), lineHeight: fontScale(22) },
  callout: { fontSize: fontScale(16), lineHeight: fontScale(21) },
  subhead: { fontSize: fontScale(15), lineHeight: fontScale(20) },
  footnote: { fontSize: fontScale(13), lineHeight: fontScale(18) },
  caption: { fontSize: fontScale(12), lineHeight: fontScale(16) },
  caption2: { fontSize: fontScale(11), lineHeight: fontScale(13) },
});

export const typeDefaults = {
  largeTitle: { family: 'brand', weight: 'bold' },
  title1: { family: 'brand', weight: 'bold' },
  title2: { family: 'brand', weight: 'semibold' },
  title3: { family: 'system', weight: 'semibold' },
  headline: { family: 'system', weight: 'semibold' },
  body: { family: 'system', weight: 'normal' },
  callout: { family: 'system', weight: 'normal' },
  subhead: { family: 'system', weight: 'normal' },
  footnote: { family: 'system', weight: 'normal' },
  caption: { family: 'system', weight: 'normal' },
  caption2: { family: 'system', weight: 'normal' },
} satisfies Record<TextType, { family: TextFamily; weight: TextWeight }>;

const italicFontMap = {
  ultralight: theme.fontFamilyLightItalic,
  thin: theme.fontFamilyLightItalic,
  light: theme.fontFamilyLightItalic,
  normal: theme.fontFamilyRegularItalic,
  medium: theme.fontFamilyItalic,
  semibold: theme.fontFamilySemiBoldItalic,
  bold: theme.fontFamilyBoldItalic,
  heavy: theme.fontFamilyHeavyItalic,
  black: theme.fontFamilyBlackItalic,
} satisfies Record<TextWeight, string>;

const uprightFontMap = {
  ultralight: theme.fontFamilyLight,
  thin: theme.fontFamilyLight,
  light: theme.fontFamilyLight,
  normal: theme.fontFamilyRegular,
  medium: theme.fontFamily,
  semibold: theme.fontFamilySemiBold,
  bold: theme.fontFamilyBold,
  heavy: theme.fontFamilyHeavy,
  black: theme.fontFamilyBlack,
} satisfies Record<TextWeight, string>;

export const weightMap = {
  black: '900',
  bold: '700',
  heavy: '800',
  light: '300',
  medium: '500',
  normal: '400',
  semibold: '600',
  thin: '200',
  ultralight: '100',
} satisfies Record<TextWeight, TextStyle['fontWeight']>;

export function getFontFamily(
  variant: TextVariant,
  weight: TextWeight,
  italic?: boolean,
): string | undefined {
  if (variant === 'mono') {
    return 'monospace';
  }

  return italic ? italicFontMap[weight] : uprightFontMap[weight];
}

type StyleEntry = TextProps['style'] | readonly TextProps['style'][];

/**
 * Last entry wins, the same way React Native merges style arrays. Walks the
 * array from the end without copying it, so a hit on the last element costs
 * one read.
 */
export function findStyleValue<TKey extends 'fontFamily' | 'fontWeight'>(
  style: StyleEntry,
  key: TKey,
): TextStyle[TKey] | undefined {
  if (!style) {
    return undefined;
  }

  if (!Array.isArray(style)) {
    // SAFETY: a RegisteredStyle number gives undefined for any key.
    return (style as TextStyle)[key];
  }

  for (let index = style.length - 1; index >= 0; index -= 1) {
    const value = findStyleValue(style[index], key);

    if (value != null) {
      return value;
    }
  }

  return undefined;
}

const fontWeightToTextWeight = new Map<string, TextWeight>([
  ['100', 'ultralight'],
  ['200', 'thin'],
  ['300', 'light'],
  ['400', 'normal'],
  ['500', 'medium'],
  ['600', 'semibold'],
  ['700', 'bold'],
  ['800', 'heavy'],
  ['900', 'black'],
  ['bold', 'bold'],
  ['normal', 'normal'],
]);

/**
 * Fixed-weight font files ignore `fontWeight` on iOS, so style weights map
 * to the theme token whose family renders them.
 */
export function resolveWeightFromFontWeight(
  fontWeight: TextStyle['fontWeight'] | number,
): TextWeight | undefined {
  if (fontWeight == null) {
    return undefined;
  }

  const direct = fontWeightToTextWeight.get(String(fontWeight));

  if (direct) {
    return direct;
  }

  const numeric = Number(fontWeight);

  if (Number.isNaN(numeric)) {
    return undefined;
  }

  const clamped = Math.min(900, Math.max(100, Math.round(numeric / 100) * 100));
  return fontWeightToTextWeight.get(String(clamped));
}
