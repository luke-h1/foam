import { memo } from 'react';
import { type StyleProp, StyleSheet, type TextStyle } from 'react-native';

import { useSelector } from '@legendapp/state/react';

import { ChatText } from '@app/components/chat/components/chat-text/ChatText';
import { chatStore$ } from '@app/store/chat/observables/chat-store';
import { usePaintRenderer } from '@app/store/preference-store';
import { theme } from '@app/styles/themes';
import type { PaintData } from '@app/types/seven-tv/cosmetics';
import { isVisibleSevenTvColor } from '@app/utils/color/isVisibleSevenTvColor';
import { sevenTvColorToCss } from '@app/utils/color/sevenTvColorToCss';

import { chatLineMetrics } from '../util/chatScale';
import { PaintedUsernameHostedLayers } from './PaintedUsernameHostedLayers';
import { PaintedUsernameSkia } from './PaintedUsernameSkia';
import { DEFAULT_PAINT_DROP_SHADOW_MODE } from './util/paint-layer/defaultPaintDropShadowMode';
import type { PaintDropShadowMode } from './util/paint-layer/getPaintDropShadows';

interface PaintedUsernameProps {
  username: string;
  paint?: PaintData;
  userId?: string;
  fallbackColor?: string;
  showColon?: boolean;
  sevenTvPaintDropShadows?: PaintDropShadowMode;
  usernameTextStyle?: StyleProp<TextStyle>;
}

interface PaintedUsernameWithPaintProps {
  displayUsername: string;
  fallbackColor: string;
  fontSize?: number;
  lineHeight?: number;
  isModerated: boolean;
  paint: PaintData;
  plainColor: string;
  sevenTvPaintDropShadows: PaintDropShadowMode;
  usernameTextStyle?: StyleProp<TextStyle>;
}

function PaintedUsernameWithPaint({
  displayUsername,
  fallbackColor,
  fontSize,
  lineHeight,
  isModerated,
  paint,
  plainColor,
  sevenTvPaintDropShadows,
  usernameTextStyle,
}: PaintedUsernameWithPaintProps) {
  const paintRenderer = usePaintRenderer();

  if (paintRenderer === 'off') {
    return (
      <ChatText
        style={[styles.plainUsername, { color: plainColor }, usernameTextStyle]}
      >
        {displayUsername}
      </ChatText>
    );
  }

  // Skia keeps the paint during a fling. Deleted names stay on the hosted
  // fill so the strikethrough still draws. That fill sheds on native only.
  if (paintRenderer === 'skia' && !isModerated) {
    return (
      <PaintedUsernameSkia
        {...{
          username: displayUsername,
          paint,
          fallbackColor,
          fontSize,
          lineHeight,
        }}
      />
    );
  }

  return (
    <PaintedUsernameHostedLayers
      {...{
        displayUsername,
        fallbackColor,
        fontSize,
        lineHeight,
        paint,
        plainColor,
        sevenTvPaintDropShadows,
        usernameTextStyle,
        useWebView: paintRenderer === 'webview' && !isModerated,
      }}
    />
  );
}

function PaintedUsernameComponent({
  username,
  paint: paintProp,
  userId,
  fallbackColor = theme.color.text.dark,
  showColon = true,
  sevenTvPaintDropShadows: sevenTvPaintDropShadowsProp,
  usernameTextStyle,
}: PaintedUsernameProps) {
  const sevenTvPaintDropShadows =
    sevenTvPaintDropShadowsProp ?? DEFAULT_PAINT_DROP_SHADOW_MODE;

  const displayUsername = showColon ? `${username}: ` : username;

  const storePaint = useSelector(() => {
    if (!userId) {
      return null;
    }

    const paintId = chatStore$.userPaintIds[userId]?.get();
    return paintId ? chatStore$.paints[paintId]?.get() : null;
  });

  const paint = paintProp ?? storePaint ?? null;

  if (!paint) {
    return (
      <ChatText
        style={[
          styles.plainUsername,
          { color: fallbackColor },
          usernameTextStyle,
        ]}
      >
        {displayUsername}
      </ChatText>
    );
  }

  const solidFallback = isVisibleSevenTvColor(paint.color)
    ? sevenTvColorToCss(paint.color)
    : fallbackColor;

  const flatUsernameStyle = StyleSheet.flatten(usernameTextStyle);
  const isModerated = flatUsernameStyle?.textDecorationLine === 'line-through';

  return (
    <PaintedUsernameWithPaint
      {...{
        displayUsername,
        fallbackColor: solidFallback,
        fontSize: flatUsernameStyle?.fontSize,
        lineHeight: flatUsernameStyle?.lineHeight,
        isModerated,
        paint,
        plainColor: fallbackColor,
        sevenTvPaintDropShadows,
        usernameTextStyle,
      }}
    />
  );
}

const styles = StyleSheet.create({
  plainUsername: {
    ...chatLineMetrics.comfortable,
    fontWeight: 'bold',
  },
});

export const PaintedUsername = memo(PaintedUsernameComponent);
