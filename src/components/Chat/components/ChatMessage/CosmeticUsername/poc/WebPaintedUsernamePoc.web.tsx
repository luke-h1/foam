import { chatLineMetrics } from '@app/components/Chat/components/ChatMessage/RichChatMessage.styles';
import { Text } from '@app/components/ui/Text/Text';
import { theme } from '@app/styles/themes';
import type { PaintData } from '@app/types/seventv/cosmetics';

interface WebPaintedUsernamePocProps {
  username: string;
  paint: PaintData;
  fallbackColor?: string;
}

export function WebPaintedUsernamePoc({
  username,
  fallbackColor = theme.color.text.dark,
}: WebPaintedUsernamePocProps) {
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
