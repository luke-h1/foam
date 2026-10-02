import { ReactNode, type Ref } from 'react';
import {
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

import {
  findStyleValue,
  getFontFamily,
  resolveWeightFromFontWeight,
  sizeStyles,
  typeDefaults,
  weightMap,
} from './text.styles';

/**
 * The type ramp, named after the iOS text styles. The three title styles
 * render in the brand font; everything else renders in the system font so
 * rows, controls and body copy match the native screens beside them.
 */
export type TextType =
  | 'largeTitle'
  | 'title1'
  | 'title2'
  | 'title3'
  | 'headline'
  | 'body'
  | 'callout'
  | 'subhead'
  | 'footnote'
  | 'caption'
  | 'caption2';

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

export type TextFamily = 'brand' | 'system';

export interface TextProps extends RNTextProps, MarginProps {
  ref?: Ref<RNText>;
  children?: ReactNode;
  type?: TextType;
  weight?: TextWeight;
  variant?: TextVariant;
  /**
   * Defaults to the family of `type`: brand for the title styles, system for
   * the rest. Only applied when `variant` is 'default'.
   */
  family?: TextFamily;
  color?: ThemeColor | ThemeColorToken;
  contrast?: boolean;
  highContrast?: boolean;
  italic?: boolean;
  tabular?: boolean;
  align?: 'left' | 'center' | 'right';
}

const margin = getMargin(theme);

export function Text({
  type = 'body',
  weight = typeDefaults[type].weight,
  variant = 'default',
  family = typeDefaults[type].family,
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

  const styleWeight =
    isBrandFamily && findStyleValue(style, 'fontFamily') == null
      ? resolveWeightFromFontWeight(findStyleValue(style, 'fontWeight'))
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
