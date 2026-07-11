import { chatLineMetrics } from '@app/components/Chat/components/ChatMessage/RichChatMessage.styles';
import { Text } from '@app/components/ui/Text/Text';
import { theme } from '@app/styles/themes';
import type { PaintData } from '@app/types/seventv/cosmetics';

interface SkiaPaintedUsernamePocProps {
  username: string;
  paint: PaintData;
  fallbackColor?: string;
}

export function SkiaPaintedUsernamePoc({
  username,
  fallbackColor = theme.color.text.dark,
}: SkiaPaintedUsernamePocProps) {
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
