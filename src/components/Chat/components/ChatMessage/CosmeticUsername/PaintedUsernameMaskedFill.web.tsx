import { type StyleProp, TextStyle } from 'react-native';

import { Text } from '@app/components/ui/Text/Text';
import type { PaintData } from '@app/types/seventv/cosmetics';

import { buildPaintCssTextStyle } from './util/buildPaintCssStyle';
import type { PaintDropShadowMode } from './util/paintLayer';

interface PaintedUsernameMaskedFillProps {
  displayUsername: string;
  fallbackColor: string;
  paint: PaintData;
  maskTextStyle: StyleProp<TextStyle>;
  sevenTvPaintDropShadows: PaintDropShadowMode;
}

/**
 * Web paints mirror the 7TV extension: gradient/image backgrounds clipped to
 * glyphs, filter drop-shadows, and optional text stroke — all on one element.
 */
export function PaintedUsernameMaskedFill({
  displayUsername,
  fallbackColor,
  paint,
  maskTextStyle,
  sevenTvPaintDropShadows,
}: PaintedUsernameMaskedFillProps) {
  return (
    <Text
      style={[
        maskTextStyle,
        buildPaintCssTextStyle(paint, fallbackColor, sevenTvPaintDropShadows),
      ]}
    >
      {displayUsername}
    </Text>
  );
}
