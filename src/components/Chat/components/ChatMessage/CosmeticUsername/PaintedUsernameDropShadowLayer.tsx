import { type StyleProp, StyleSheet, TextStyle } from 'react-native';

import { Text } from '@app/components/ui/Text/Text';
import type { PaintShadow } from '@app/types/seventv/cosmetics';

import { paintShadowTextColor } from './util/paintTextStyle';

interface PaintedUsernameDropShadowLayerProps {
  displayUsername: string;
  maskTextStyle: StyleProp<TextStyle>;
  shadow: PaintShadow;
}

/**
 * CSS `drop-shadow()` (and paint `text-shadow`) only tints the glyph alpha
 * outline, not the interior. Transparent glyphs plus a blurred text-shadow in
 * the shadow color reproduces that without a MaskedView per shadow.
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
          color: 'transparent',
          textShadowColor: shadowColor,
          textShadowOffset: {
            width: shadow.x_offset || 0,
            height: shadow.y_offset || 0,
          },
          textShadowRadius: shadow.radius || 0,
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
