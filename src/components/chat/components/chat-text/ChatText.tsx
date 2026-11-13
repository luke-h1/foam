import { Text as RNText, type TextStyle } from 'react-native';

import {
  findStyleValue,
  resolveWeightFromFontWeight,
  typeDefaults,
} from '@app/components/ui/text/Text.styles';
import type { TextProps } from '@app/components/ui/text/Text.types';
import { getMargin } from '@app/styles/spacing';
import { theme } from '@app/styles/themes';

import { getChatTextStyle, getStyleWeightOverride } from './util/chatTextStyle';

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
  const resolvedStyle = getChatTextStyle({
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
