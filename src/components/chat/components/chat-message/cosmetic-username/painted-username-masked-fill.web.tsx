import { type StyleProp, TextStyle } from 'react-native';

import { ChatText } from '@app/components/chat/components/chat-text/chat-text';
import type { PaintData } from '@app/types/seven-tv/cosmetics';

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
    <ChatText style={[maskTextStyle, { color: fallbackColor }]}>
      {displayUsername}
    </ChatText>
  );
}
