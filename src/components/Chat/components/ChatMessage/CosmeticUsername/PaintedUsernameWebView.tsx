import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';

import { chatLineMetrics } from '@app/components/Chat/components/ChatMessage/RichChatMessage.styles';
import { Text } from '@app/components/ui/Text/Text';
import { theme } from '@app/styles/themes';
import type { PaintData } from '@app/types/seventv/cosmetics';

import { buildPaintedUsernameHtml } from './util/paintHtml';

interface PaintedUsernameWebViewProps {
  username: string;
  paint: PaintData;
  fallbackColor?: string;
  fontSize?: number;
  lineHeight?: number;
}

/**
 * Remounts when `html` changes so measured size cannot stick to a prior paint.
 */
export function PaintedUsernameWebView({
  username,
  paint,
  fallbackColor = theme.color.text.dark,
  fontSize = chatLineMetrics.comfortable.fontSize,
  lineHeight = chatLineMetrics.comfortable.lineHeight,
}: PaintedUsernameWebViewProps) {
  const html = useMemo(
    () =>
      buildPaintedUsernameHtml({
        displayUsername: username,
        paint,
        fallbackColor,
        fontSize,
        lineHeight,
      }),
    [username, paint, fallbackColor, fontSize, lineHeight],
  );

  return (
    <MeasuredPaintedUsernameWebView
      key={html}
      html={html}
      username={username}
      fallbackColor={fallbackColor}
      fontSize={fontSize}
    />
  );
}

function MeasuredPaintedUsernameWebView({
  html,
  username,
  fallbackColor,
  fontSize,
}: {
  html: string;
  username: string;
  fallbackColor: string;
  fontSize: number;
}) {
  const [size, setSize] = useState<{ width: number; height: number } | null>(
    null,
  );

  return (
    <View
      pointerEvents='none'
      collapsable={false}
      renderToHardwareTextureAndroid
      style={[
        styles.root,
        size ? { width: size.width, height: size.height } : null,
      ]}
    >
      {size ? null : (
        <Text style={[styles.sizer, { color: fallbackColor, fontSize }]}>
          {username}
        </Text>
      )}
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
        style={styles.webView}
        containerStyle={[
          styles.webViewContainer,
          size ? null : styles.webViewUnmeasured,
        ]}
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
            // Ignore malformed measure payloads.
          }
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    alignSelf: 'flex-start',
  },
  sizer: {
    ...chatLineMetrics.comfortable,
    fontWeight: 'bold',
  },
  webView: {
    backgroundColor: 'transparent',
  },
  webViewContainer: {
    backgroundColor: 'transparent',
  },
  webViewUnmeasured: {
    bottom: 0,
    left: 0,
    opacity: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
});
