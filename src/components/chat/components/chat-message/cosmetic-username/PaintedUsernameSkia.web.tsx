import { chatLineMetrics } from '@app/components/chat/components/chat-message/util/chatScale';
import { ChatText } from '@app/components/chat/components/chat-text/ChatText';
import { theme } from '@app/styles/themes';
import type { PaintData } from '@app/types/seven-tv/cosmetics';

interface PaintedUsernameSkiaProps {
  username: string;
  paint: PaintData;
  fallbackColor?: string;
  fontSize?: number;
  lineHeight?: number;
}

export function PaintedUsernameSkia({
  username,
  fallbackColor = theme.color.text.dark,
  fontSize,
  lineHeight,
}: PaintedUsernameSkiaProps) {
  return (
    <ChatText
      style={{
        ...chatLineMetrics.comfortable,
        fontSize,
        lineHeight: lineHeight ?? chatLineMetrics.comfortable.lineHeight,
        fontWeight: 'bold',
        color: fallbackColor,
      }}
    >
      {username}
    </ChatText>
  );
}
