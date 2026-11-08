import { chatLineMetrics } from '@app/components/chat/components/chat-message/util/chatScale';
import { ChatText } from '@app/components/chat/components/chat-text/ChatText';
import { theme } from '@app/styles/themes';
import type { PaintData } from '@app/types/seven-tv/cosmetics';

interface PaintedUsernameWebViewProps {
  username: string;
  paint: PaintData;
  fallbackColor?: string;
  fontSize?: number;
  lineHeight?: number;
}

export function PaintedUsernameWebView({
  username,
  fallbackColor = theme.color.text.dark,
  fontSize,
}: PaintedUsernameWebViewProps) {
  return (
    <ChatText
      style={{
        ...chatLineMetrics.comfortable,
        fontSize,
        fontWeight: 'bold',
        color: fallbackColor,
      }}
    >
      {username}
    </ChatText>
  );
}
