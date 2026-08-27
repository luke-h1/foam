import { type StyleProp, StyleSheet, TextStyle } from 'react-native';

import { Text } from '@app/components/ui/Text/Text';
import type { PaintShadow } from '@app/types/seventv/cosmetics';

import { paintShadowTextColor } from './util/paintTextStyle/paintShadowTextColor';

interface PaintedUsernameDropShadowLayerProps {
  displayUsername: string;
  maskTextStyle: StyleProp<TextStyle>;
  shadow: PaintShadow;
}

/**
 * A solid glyph copy in the shadow color plus a same-color text shadow for
 * the blur halo reproduces CSS `drop-shadow()` without a MaskedView per shadow.
 */
export function PaintedUsernameDropShadowLayer({
  displayUsername,
  maskTextStyle,
  shadow,
}: PaintedUsernameDropShadowLayerProps) {
  const shadowColor = paintShadowTextColor(shadow);

  return (
    <Text
      pointerEvents='none'
      style={[
        styles.shadowText,
        maskTextStyle,
        {
          color: shadowColor,
          left: shadow.x_offset || 0,
          textShadowColor: shadowColor,
          textShadowOffset: { width: 0, height: 0 },
          textShadowRadius: shadow.radius || 0,
          top: shadow.y_offset || 0,
        },
      ]}
    >
      {displayUsername}
    </Text>
  );
}

const styles = StyleSheet.create({
  shadowText: {
    position: 'absolute',
  },
});
