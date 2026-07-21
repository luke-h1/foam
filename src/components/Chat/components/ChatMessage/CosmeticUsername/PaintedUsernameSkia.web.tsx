import { useColorScheme } from 'react-native';

import { chatLineMetrics } from '@app/components/Chat/components/ChatMessage/RichChatMessage.styles';
import { Text } from '@app/components/ui/Text/Text';
import { theme } from '@app/styles/themes';
import type { PaintData } from '@app/types/seventv/cosmetics';

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
  fallbackColor: fallbackColorProp,
  fontSize,
}: PaintedUsernameSkiaProps) {
  const colorScheme = useColorScheme();
  const scheme = colorScheme === 'light' ? 'light' : 'dark';
  const fallbackColor = fallbackColorProp ?? theme.color.text[scheme];

  return (
    <Text
      style={{
        ...chatLineMetrics.comfortable,
        fontSize,
        fontWeight: '700',
        color: fallbackColor,
      }}
    >
      {username}
    </Text>
  );
}
