// eslint-disable-next-line no-restricted-imports
import { Text as RNText, type TextStyle } from 'react-native';

import type {
  TextFamily,
  TextProps,
  TextType,
  TextVariant,
  TextWeight,
} from '@app/components/ui/text/text';
import {
  findStyleValue,
  getFontFamily,
  resolveWeightFromFontWeight,
  sizeStyles,
  typeDefaults,
  weightMap,
} from '@app/components/ui/text/text.styles';
import { getMargin } from '@app/styles/spacing';
import { resolveThemeColor, theme } from '@app/styles/themes';

/**
 * Chat keeps the brand font while the rest of the app uses the system font.
 * The Skia painted usernames are rasterised in Montserrat, so a system-font
 * message body would put two typefaces on one row.
 *
 * This renders the same output as the design-system `Text`, with less work
 * per span. It caches the resolved style for each prop combination and adds
 * no extra component layer. It shares the type ramp and font maps with `Text`
 * through `text.styles.ts`.
 *
 * `chat-text.test.tsx` checks that both components give the same output.
 */

const margin = getMargin(theme);

const TABULAR_FONT_VARIANT: TextStyle['fontVariant'] = ['tabular-nums'];

interface ResolveTextStyleOptions {
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
function buildTextStyle({
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
}: ResolveTextStyleOptions): TextStyle {
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
const textStyleCache = new Map<string, TextStyle>();

function getTextStyle(options: ResolveTextStyleOptions): TextStyle {
  const key = `${options.type}|${options.variant}|${options.family}|${options.weight}|${options.color}|${options.contrast}|${options.highContrast}|${options.italic ? 1 : 0}|${options.tabular ? 1 : 0}|${options.align}`;

  const cached = textStyleCache.get(key);

  if (cached) {
    return cached;
  }

  const textStyle = buildTextStyle(options);
  textStyleCache.set(key, textStyle);
  return textStyle;
}

/**
 * Fixed-weight font files ignore `fontWeight` on iOS, so a weight set in the
 * style maps to the theme family that renders it. One object per weight and
 * slant, shared by every span that resolves to it.
 */
const styleWeightOverrides = new Map<string, TextStyle>();

function getStyleWeightOverride(
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

export function ChatText({
  type = 'callout',
  weight = typeDefaults[type].weight,
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
  const resolvedStyle = getTextStyle({
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
  });

  const hasMargin =
    m !== undefined ||
    mb !== undefined ||
    ml !== undefined ||
    mr !== undefined ||
    mt !== undefined ||
    mx !== undefined ||
    my !== undefined;

  // Margins are rare on a chat span, so only that path pays for a merge.
  const textStyle: TextStyle = hasMargin
    ? { ...margin({ m, mb, ml, mr, mt, mx, my }), ...resolvedStyle }
    : resolvedStyle;

  const isBrandFamily = family === 'brand' && variant === 'default';

  const styleWeight =
    isBrandFamily && findStyleValue(style, 'fontFamily') == null
      ? resolveWeightFromFontWeight(findStyleValue(style, 'fontWeight'))
      : undefined;

  const styleWeightOverride = styleWeight
    ? getStyleWeightOverride(styleWeight, italic)
    : null;

  return (
    <RNText
      ref={ref}
      textBreakStrategy='simple'
      maxFontSizeMultiplier={maxFontSizeMultiplier}
      {...props}
      style={[textStyle, style, styleWeightOverride]}
    >
      {children}
    </RNText>
  );
}
