import type { PaintData } from '@app/utils/color/seventv-ws-service';
import { type StyleProp, TextStyle } from 'react-native';
import { Text } from '@app/components/ui/Text/Text';

interface PaintedUsernameMaskedFillProps {
  displayUsername: string;
  fallbackColor: string;
  paint: PaintData;
  maskTextStyle: StyleProp<TextStyle>;
}

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
