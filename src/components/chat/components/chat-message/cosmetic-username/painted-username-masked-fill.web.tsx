import type { StyleProp, TextStyle } from 'react-native';

import { ChatText } from '@app/components/chat/components/chat-text/chat-text';
import type { PaintData } from '@app/types/seven-tv/cosmetics';

import { buildPaintFillTextStyle } from './util/paint-css/build-paint-fill-text-style';

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
  paint,
}: PaintedUsernameMaskedFillProps) {
  return (
    <ChatText
      style={[maskTextStyle, buildPaintFillTextStyle(paint, fallbackColor)]}
    >
      {displayUsername}
    </ChatText>
  );
}
