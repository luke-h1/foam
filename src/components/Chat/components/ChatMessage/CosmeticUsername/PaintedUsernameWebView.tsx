import { useMemo, useState } from 'react';
import { View } from 'react-native';
import { WebView } from 'react-native-webview';

import { chatLineMetrics } from '@app/components/Chat/components/ChatMessage/RichChatMessage.styles';
import { theme } from '@app/styles/themes';
import type { PaintData } from '@app/types/seventv/cosmetics';

import { buildPaintedUsernameHtml } from './util/paintHtml';

interface PaintedUsernameWebViewProps {
  username: string;
  paint: PaintData;
  fallbackColor?: string;
}

export function PaintedUsernameWebView({
  username,
  paint,
  fallbackColor = theme.color.text.dark,
}: PaintedUsernameWebViewProps) {
  const [size, setSize] = useState<{ width: number; height: number } | null>(
    null,
  );

  const html = useMemo(
    () =>
      buildPaintedUsernameHtml({
        displayUsername: username,
        paint,
        fallbackColor,
        fontSize: chatLineMetrics.comfortable.fontSize,
        lineHeight: chatLineMetrics.comfortable.lineHeight,
      }),
    [username, paint, fallbackColor],
  );

  return (
    <View
      pointerEvents='none'
      collapsable={false}
      renderToHardwareTextureAndroid
      style={{
        width: size?.width ?? 160,
        height: size?.height ?? chatLineMetrics.comfortable.lineHeight,
      }}
    >
      <WebView
        source={{ html }}
        originWhitelist={['*']}
        scrollEnabled={false}
        nestedScrollEnabled={false}
        overScrollMode='never'
        setSupportMultipleWindows={false}
        automaticallyAdjustContentInsets={false}
        androidLayerType='hardware'
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        style={{ backgroundColor: 'transparent' }}
        containerStyle={{ backgroundColor: 'transparent' }}
        onMessage={event => {
          try {
            const measured = JSON.parse(event.nativeEvent.data) as {
              width: number;
              height: number;
            };
            setSize({
              width: Math.ceil(measured.width),
              height: Math.ceil(measured.height),
            });
          } catch {
            // Ignore
          }
        }}
      />
    </View>
  );
}
