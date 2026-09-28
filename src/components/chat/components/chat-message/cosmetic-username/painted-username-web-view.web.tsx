import { chatLineMetrics } from '@app/components/chat/components/chat-message/util/chat-scale';
import { Text } from '@app/components/ui/text/text';
import { theme } from '@app/styles/themes';
import type { PaintData } from '@app/types/seven-tv/cosmetics';

interface PaintedUsernameWebViewProps {
  username: string;
  paint: PaintData;
  fallbackColor?: string;
  fontSize?: number;
  lineHeight?: number;
}

/**
 * WebView paints are native-only; web falls back to solid colour.
 */
export function PaintedUsernameWebView({
  username,
  fallbackColor = theme.color.text.dark,
  fontSize,
}: PaintedUsernameWebViewProps) {
  return (
    <Text
      style={{
        ...chatLineMetrics.comfortable,
        fontSize,
        fontWeight: 'bold',
        color: fallbackColor,
      }}
    >
      {username}
    </Text>
  );
}
