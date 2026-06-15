import type { PaintData } from '@app/utils/color/seventv-ws-service';
import { type StyleProp, TextStyle } from 'react-native';
import { Text } from '@app/components/ui/Text/Text';

interface PaintedUsernameMaskedFillProps {
  displayUsername: string;
  fallbackColor: string;
  paint: PaintData;
  maskTextStyle: StyleProp<TextStyle>;
}

/**
 * Web fallback: Expo UI's MaskedView has no web implementation, so render the
 * username in the paint's representative colour instead of the glyph-clipped
 * gradient. The drop-shadow/stroke underlays still render from CosmeticUsername.
 */
export function PaintedUsernameMaskedFill({
  displayUsername,
  fallbackColor,
  maskTextStyle,
}: PaintedUsernameMaskedFillProps) {
  return (
    <Text style={[maskTextStyle, { color: fallbackColor }]}>
      {displayUsername}
    </Text>
  );
}
