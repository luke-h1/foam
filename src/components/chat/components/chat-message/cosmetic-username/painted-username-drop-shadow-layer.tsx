import { type StyleProp, StyleSheet, TextStyle } from 'react-native';

import { ChatText } from '@app/components/chat/components/chat-text/chat-text';
import type { PaintShadow } from '@app/types/seven-tv/cosmetics';
import { sevenTvColorToCss } from '@app/utils/color/seven-tv-color-to-css';

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
  const shadowColor = sevenTvColorToCss(shadow.color);

  return (
    <ChatText
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
    </ChatText>
  );
}

const styles = StyleSheet.create({
  shadowText: {
    position: 'absolute',
  },
});
