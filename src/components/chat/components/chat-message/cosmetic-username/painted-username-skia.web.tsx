import { chatLineMetrics } from '@app/components/chat/components/chat-message/util/chat-scale';
import { ChatText } from '@app/components/chat/components/chat-text/chat-text';
import { theme } from '@app/styles/themes';
import type { PaintData } from '@app/types/seven-tv/cosmetics';

interface PaintedUsernameSkiaProps {
  username: string;
  paint: PaintData;
  fallbackColor?: string;
  fontSize?: number;
}

/**
 * Skia paints are native-only; web falls back to solid colour.
 */
export function PaintedUsernameSkia({
  username,
  fallbackColor = theme.color.text.dark,
  fontSize,
}: PaintedUsernameSkiaProps) {
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
