import { Text as RNText, type TextStyle } from 'react-native';

import { typeDefaults } from '@app/components/ui/text/Text.styles';
import type { TextProps } from '@app/components/ui/text/Text.types';
import { getMargin } from '@app/styles/spacing';
import { theme } from '@app/styles/themes';

import {
  CHAT_TEXT_SPAN_DEFAULTS,
  getChatTextStyle,
  resolveBrandWeightOverride,
} from './util/chatTextStyle';

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
  maxFontSizeMultiplier = CHAT_TEXT_SPAN_DEFAULTS.maxFontSizeMultiplier,
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

  const styleWeightOverride = isBrandFamily
    ? resolveBrandWeightOverride(style, italic)
    : null;

  return (
    <RNText
      ref={ref}
      textBreakStrategy={CHAT_TEXT_SPAN_DEFAULTS.textBreakStrategy}
      maxFontSizeMultiplier={maxFontSizeMultiplier}
      {...props}
      style={[textStyle, style, styleWeightOverride]}
    >
      {children}
    </RNText>
  );
}
