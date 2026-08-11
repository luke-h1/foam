import { memo } from 'react';
import { type StyleProp, StyleSheet, TextStyle } from 'react-native';

import { useSelector } from '@legendapp/state/react';

import { Text } from '@app/components/ui/Text/Text';
import { chatStore$ } from '@app/store/chat/observables/chatStore';
import { usePaintRenderer } from '@app/store/preferenceStore';
import { theme } from '@app/styles/themes';
import type { PaintData } from '@app/types/seventv/cosmetics';
import { isVisibleSevenTvColor } from '@app/utils/color/isVisibleSevenTvColor';
import { sevenTvColorToCss } from '@app/utils/color/sevenTvColorToCss';

import { chatLineMetrics } from '../chatScale';
import { PaintedUsernameHostedLayers } from './PaintedUsernameHostedLayers';
import { PaintedUsernameSkia } from './PaintedUsernameSkia';
import { DEFAULT_PAINT_DROP_SHADOW_MODE } from './util/paintLayer/DEFAULT_PAINT_DROP_SHADOW_MODE';
import type { PaintDropShadowMode } from './util/paintLayer/getPaintDropShadows';

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
      <Text
        style={[styles.plainUsername, { color: plainColor }, usernameTextStyle]}
      >
        {displayUsername}
      </Text>
    );
  }

  // Skia draws a cached bitmap, so a fling costs it no more than rest does and
  // it keeps its paint throughout; only the hosted renderers shed.
  if (paintRenderer === 'skia' && !isModerated) {
    return (
      <PaintedUsernameSkia
        username={displayUsername}
        paint={paint}
        fallbackColor={fallbackColor}
        fontSize={fontSize}
      />
    );
  }

  return (
    <PaintedUsernameHostedLayers
      displayUsername={displayUsername}
      fallbackColor={fallbackColor}
      fontSize={fontSize}
      lineHeight={lineHeight}
      paint={paint}
      plainColor={plainColor}
      sevenTvPaintDropShadows={sevenTvPaintDropShadows}
      usernameTextStyle={usernameTextStyle}
      useWebView={paintRenderer === 'webview' && !isModerated}
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
      <Text
        style={[
          styles.plainUsername,
          { color: fallbackColor },
          usernameTextStyle,
        ]}
      >
        {displayUsername}
      </Text>
    );
  }

  const solidFallback = isVisibleSevenTvColor(paint.color)
    ? sevenTvColorToCss(paint.color)
    : fallbackColor;

  const flatUsernameStyle = StyleSheet.flatten(usernameTextStyle);
  const isModerated = flatUsernameStyle?.textDecorationLine === 'line-through';

  return (
    <PaintedUsernameWithPaint
      displayUsername={displayUsername}
      fallbackColor={solidFallback}
      fontSize={flatUsernameStyle?.fontSize}
      lineHeight={flatUsernameStyle?.lineHeight}
      isModerated={isModerated}
      paint={paint}
      plainColor={fallbackColor}
      sevenTvPaintDropShadows={sevenTvPaintDropShadows}
      usernameTextStyle={usernameTextStyle}
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
