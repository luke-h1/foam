import type { StyleProp, TextStyle } from 'react-native';

import {
  findStyleValue,
  getFontFamily,
  resolveWeightFromFontWeight,
  sizeStyles,
  weightMap,
} from '@app/components/ui/text/Text.styles';
import type {
  TextFamily,
  TextProps,
  TextType,
  TextVariant,
  TextWeight,
} from '@app/components/ui/text/Text.types';
import { resolveThemeColor } from '@app/styles/themes';

const TABULAR_FONT_VARIANT: TextStyle['fontVariant'] = ['tabular-nums'];

interface ResolveChatTextStyleOptions {
  align: NonNullable<TextProps['align']>;
  color: NonNullable<TextProps['color']>;
  contrast: boolean | undefined;
  family: TextFamily;
  highContrast: boolean | undefined;
  italic: boolean | undefined;
  tabular: boolean | undefined;
  type: TextType;
  variant: TextVariant;
  weight: TextWeight;
}

function buildChatTextStyle({
  align,
  color,
  contrast,
  family,
  highContrast,
  italic,
  tabular,
  type,
  variant,
  weight,
}: ResolveChatTextStyleOptions): TextStyle {
  const effectiveContrast =
    contrast === undefined ? color === 'gray' : contrast;

  const isSystemFamily = family === 'system' && variant === 'default';

  return {
    ...sizeStyles[type],
    color: resolveThemeColor(color, {
      contrast: effectiveContrast,
      highContrast,
    }),
    fontFamily: isSystemFamily
      ? undefined
      : getFontFamily(variant, weight, italic),
    fontStyle:
      (variant === 'mono' || isSystemFamily) && italic ? 'italic' : 'normal',
    fontVariant: tabular ? TABULAR_FONT_VARIANT : undefined,
    fontWeight:
      variant === 'mono' || isSystemFamily ? weightMap[weight] : undefined,
    textAlign: align,
  };
}

const chatTextStyleCache = new Map<string, TextStyle>();

export function getChatTextStyle(
  options: ResolveChatTextStyleOptions,
): TextStyle {
  const key = `${options.type}|${options.variant}|${options.family}|${options.weight}|${options.color}|${options.contrast}|${options.highContrast}|${options.italic ? 1 : 0}|${options.tabular ? 1 : 0}|${options.align}`;

  const cached = chatTextStyleCache.get(key);

  if (cached) {
    return cached;
  }

  const textStyle = buildChatTextStyle(options);
  chatTextStyleCache.set(key, textStyle);
  return textStyle;
}

const styleWeightOverrides = new Map<string, TextStyle>();

export function getStyleWeightOverride(
  styleWeight: TextWeight,
  italic: boolean | undefined,
): TextStyle {
  const key = italic ? `${styleWeight}|italic` : styleWeight;
  const cached = styleWeightOverrides.get(key);

  if (cached) {
    return cached;
  }

  const override: TextStyle = {
    fontFamily: getFontFamily('default', styleWeight, italic),
    fontWeight: undefined,
  };

  styleWeightOverrides.set(key, override);
  return override;
}

export function resolveBrandWeightOverride(
  style: StyleProp<TextStyle>,
  italic: boolean | undefined,
): TextStyle | null {
  if (findStyleValue(style, 'fontFamily') != null) {
    return null;
  }

  const styleWeight = resolveWeightFromFontWeight(
    findStyleValue(style, 'fontWeight'),
  );

  return styleWeight ? getStyleWeightOverride(styleWeight, italic) : null;
}

export const CHAT_TEXT_SPAN_DEFAULTS = {
  maxFontSizeMultiplier: 2,
  textBreakStrategy: 'simple',
} as const;
