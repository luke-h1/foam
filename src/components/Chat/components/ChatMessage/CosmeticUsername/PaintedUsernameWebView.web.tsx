import { useColorScheme } from 'react-native';

import { chatLineMetrics } from '@app/components/Chat/components/ChatMessage/RichChatMessage.styles';
import { Text } from '@app/components/ui/Text/Text';
import { theme } from '@app/styles/themes';
import type { PaintData } from '@app/types/seventv/cosmetics';

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
  fallbackColor: fallbackColorProp,
  fontSize,
}: PaintedUsernameWebViewProps) {
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
