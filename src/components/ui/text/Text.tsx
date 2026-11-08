import { Text as RNText, type TextStyle } from 'react-native';

import { getMargin } from '@app/styles/spacing';
import { resolveThemeColor, theme } from '@app/styles/themes';

import {
  findStyleValue,
  getFontFamily,
  resolveWeightFromFontWeight,
  sizeStyles,
  typeDefaults,
  weightMap,
} from './Text.styles';
import type { TextProps } from './Text.types';

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
