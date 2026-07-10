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

/**
 * Renders a painted username with the extension's actual CSS pipeline (gradient
 * stack clipped via background-clip: text, drop-shadow filter chain) inside a
 * live WebView, sized from the span's measured rect.
 *
 * Dev-only fidelity reference (WebKit/Chromium computes the CSS), reachable via
 * the paint-renderer dev override — not a shippable chat renderer: one web
 * content process per row is far too heavy
 * for the virtualized list, and no amount of prop tuning removes that ceiling
 * (an Expo DOM component is the same WebView underneath, so it doesn't help).
 * The production shape is a single shared offscreen WebView that snapshots to
 * a cached bitmap; a live WebView is only defensible on non-virtualized
 * surfaces (the user card). The props below shave what can be shaved: hardware
 * compositing, no scroll/zoom/multi-window machinery, and `pointerEvents:none`
 * so the layer never eats the row's tap-to-open-profile.
 */
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
            // Ignore messages that aren't the measurement payload.
          }
        }}
      />
    </View>
  );
}
