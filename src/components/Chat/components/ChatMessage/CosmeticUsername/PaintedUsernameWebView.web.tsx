import { chatLineMetrics } from '@app/components/Chat/components/ChatMessage/RichChatMessage.styles';
import { Text } from '@app/components/ui/Text/Text';
import { theme } from '@app/styles/themes';
import type { PaintData } from '@app/types/seventv/cosmetics';

interface PaintedUsernameWebViewProps {
  username: string;
  paint: PaintData;
  fallbackColor?: string;
}

export function PaintedUsernameWebView({
  username,
  fallbackColor = theme.color.text.dark,
}: PaintedUsernameWebViewProps) {
  return (
    <Text
      style={{
        ...chatLineMetrics.comfortable,
        fontWeight: 'bold',
        color: fallbackColor,
      }}
    >
      {username}
    </Text>
  );
}
