import { useMemo, useState } from 'react';
import { View } from 'react-native';
import { WebView } from 'react-native-webview';

import { chatLineMetrics } from '@app/components/Chat/components/ChatMessage/RichChatMessage.styles';
import { theme } from '@app/styles/themes';
import type { PaintData } from '@app/types/seventv/cosmetics';

import { buildPaintedUsernameHtml } from './util/paintHtml';

interface WebPaintedUsernamePocProps {
  username: string;
  paint: PaintData;
  fallbackColor?: string;
}

/**
 * POC: renders a painted username with the extension's actual CSS pipeline
 * (gradient stack clipped via background-clip: text, drop-shadow filter
 * chain) inside a live WebView, sized from the span's measured rect.
 *
 * This is the fidelity reference — WebKit/Chromium computes the CSS — not a
 * shippable chat renderer: one web content process per row is far too heavy
 * for the virtualized list. The production shape is a single shared offscreen
 * WebView that snapshots to a cached bitmap; live WebViews would only ever be
 * defensible for the handful of non-virtualized surfaces (user card).
 */
export function WebPaintedUsernamePoc({
  username,
  paint,
  fallbackColor = theme.color.text.dark,
}: WebPaintedUsernamePocProps) {
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
      style={{
        width: size?.width ?? 160,
        height: size?.height ?? chatLineMetrics.comfortable.lineHeight,
      }}
    >
      <WebView
        source={{ html }}
        originWhitelist={['*']}
        scrollEnabled={false}
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
            // Ignore messages that aren't the measurement payload.
          }
        }}
      />
    </View>
  );
}
