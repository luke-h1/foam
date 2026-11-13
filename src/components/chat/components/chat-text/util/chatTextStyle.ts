import type { TextStyle } from 'react-native';

import {
  getFontFamily,
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

export interface ResolveChatTextStyleOptions {
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

/**
 * The size ramp entry and the resolved text style in one object: `Text` hands
 * RN both as separate array entries, and flattening them gives the same
 * result as merging them here once.
 */
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

/**
 * Every input is a small enum or a boolean, so the resolved style is shared
 * across renders and across spans; a row's four spans usually hit two entries.
 */
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

/**
 * Fixed-weight brand font files ignore `fontWeight` on iOS, so a style weight
 * on a brand span becomes the font family that renders it.
 */
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
