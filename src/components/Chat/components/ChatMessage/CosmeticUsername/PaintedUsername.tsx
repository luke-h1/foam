import { memo } from 'react';
import {
  type StyleProp,
  StyleSheet,
  TextStyle,
  useColorScheme,
  View,
} from 'react-native';

import { useSelector } from '@legendapp/state/react';

import { useChatScrollActive } from '@app/components/Chat/util/useChatScrollActive';
import { Text } from '@app/components/ui/Text/Text';
import { chatStore$ } from '@app/store/chat/observables/chatStore';
import { usePaintRenderer } from '@app/store/preferences/selectors';
import { theme } from '@app/styles/themes';
import type { PaintData } from '@app/types/seventv/cosmetics';
import { sevenTvColorToCss } from '@app/utils/color/sevenTvColorToCss';

import { chatLineMetrics } from '../RichChatMessage.styles';
import { PaintedUsernameDropShadowLayer } from './PaintedUsernameDropShadowLayer';
import { PaintedUsernameMaskedFill } from './PaintedUsernameMaskedFill';
import { PaintedUsernameSkia } from './PaintedUsernameSkia';
import { PaintedUsernameWebView } from './PaintedUsernameWebView';
import { DEFAULT_PAINT_DROP_SHADOW_MODE } from './util/paintLayer/DEFAULT_PAINT_DROP_SHADOW_MODE';
import {
  getPaintDropShadows,
  type PaintDropShadowMode,
} from './util/paintLayer/getPaintDropShadows';
import { paintShadowKey } from './util/paintLayer/paintShadowKey';
import { buildPaintUsernameTextStyle } from './util/paintTextStyle/buildPaintUsernameTextStyle';
import { getPaintTextShadows } from './util/paintTextStyle/getPaintTextShadows';
import { getPaintTextStroke } from './util/paintTextStyle/getPaintTextStroke';
import { paintStrokeToShadow } from './util/paintTextStyle/paintStrokeToShadow';

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
  // Painted rows only - in the parent this re-renders every visible row twice per fling.
  const isScrolling = useChatScrollActive();
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

  // Solid colour during fling: skip MaskedView/gradient/SVG/image layers while
  // the render encoder is pressured (FOAM-TV-MOBILE-BJ). Full paint returns ~150ms after settle.
  if (isScrolling) {
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

  if (paintRenderer === 'webview' && !isModerated) {
    return (
      <PaintedUsernameWebView
        username={displayUsername}
        paint={paint}
        fallbackColor={fallbackColor}
        fontSize={fontSize}
        lineHeight={lineHeight}
      />
    );
  }

  const paintTextStyle = buildPaintUsernameTextStyle(paint);
  const dropShadows = getPaintDropShadows(paint, sevenTvPaintDropShadows);
  const textShadows = getPaintTextShadows(paint);
  const stroke = getPaintTextStroke(paint);

  const maskTextStyle = [
    styles.maskText,
    usernameTextStyle,
    paintTextStyle,
  ] as StyleProp<TextStyle>;

  // Back to front: drop-shadows, text-shadows, stroke, then painted fill.
  const underlayShadows = [
    ...dropShadows.map(shadow => ({ shadow, source: 'drop' })),
    ...textShadows.map(shadow => ({ shadow, source: 'text' })),
    ...(stroke
      ? [{ shadow: paintStrokeToShadow(stroke), source: 'stroke' }]
      : []),
  ];

  return (
    <View style={styles.paintedWrapper}>
      {underlayShadows.map(({ shadow, source }, index) => (
        <PaintedUsernameDropShadowLayer
          // Static, never-reordered list
          // eslint-disable-next-line react-doctor/no-array-index-as-key
          key={`${source}-${index}-${paintShadowKey(shadow)}`}
          displayUsername={displayUsername}
          maskTextStyle={maskTextStyle}
          shadow={shadow}
        />
      ))}
      <PaintedUsernameMaskedFill
        displayUsername={displayUsername}
        fallbackColor={fallbackColor}
        paint={paint}
        maskTextStyle={maskTextStyle}
      />
    </View>
  );
}

function PaintedUsernameComponent({
  username,
  paint: paintProp,
  userId,
  fallbackColor: fallbackColorProp,
  showColon = true,
  sevenTvPaintDropShadows: sevenTvPaintDropShadowsProp,
  usernameTextStyle,
}: PaintedUsernameProps) {
  const colorScheme = useColorScheme();
  const scheme = colorScheme === 'light' ? 'light' : 'dark';
  const fallbackColor = fallbackColorProp ?? theme.color.text[scheme];
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

  const solidFallback =
    paint.color === null ? fallbackColor : sevenTvColorToCss(paint.color);

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
  maskText: {
    ...chatLineMetrics.comfortable,
    color: 'black',
    fontWeight: '700',
  },
  paintedWrapper: {
    alignSelf: 'flex-start',
    position: 'relative',
  },
  plainUsername: {
    ...chatLineMetrics.comfortable,
    fontWeight: '700',
  },
});

export const PaintedUsername = memo(PaintedUsernameComponent);
