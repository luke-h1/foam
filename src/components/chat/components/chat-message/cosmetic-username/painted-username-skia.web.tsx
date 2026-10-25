import { chatLineMetrics } from '@app/components/chat/components/chat-message/util/chat-scale';
import { ChatText } from '@app/components/chat/components/chat-text/chat-text';
import { theme } from '@app/styles/themes';
import type { PaintData } from '@app/types/seven-tv/cosmetics';

interface PaintedUsernameSkiaProps {
  username: string;
  paint: PaintData;
  fallbackColor?: string;
  fontSize?: number;
  lineHeight?: number;
}

/**
 * Skia paints are native-only. Web draws the paint with CSS in the hosted
 * fill, so this stub is only the solid name if that path is not used.
 */
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
