import { memo } from 'react';
import { type StyleProp, StyleSheet,TextStyle, View } from 'react-native';

import { useSelector } from '@legendapp/state/react';

import { useChatScrollActive } from '@app/components/Chat/util/useChatScrollActive';
import { Text } from '@app/components/ui/Text/Text';
import { chatStore$ } from '@app/store/chat/observables/chatStore';
import type { PaintData } from '@app/utils/color/seventv-ws-service';
import { sevenTvColorToCss } from '@app/utils/color/sevenTvColorToCss';

import { chatLineMetrics } from '../RichChatMessage.styles';
import { PaintedUsernameDropShadowLayer } from './PaintedUsernameDropShadowLayer';
import { PaintedUsernameMaskedFill } from './PaintedUsernameMaskedFill';
import {
  DEFAULT_PAINT_DROP_SHADOW_MODE,
  getPaintDropShadows,
  type PaintDropShadowMode,
  paintShadowKey,
} from './util/paintLayer';
import {
  buildPaintUsernameTextStyle,
  getPaintTextShadows,
  getPaintTextStroke,
  paintStrokeToShadow,
} from './util/paintTextStyle';

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
  paint: PaintData;
  sevenTvPaintDropShadows: PaintDropShadowMode;
  usernameTextStyle?: StyleProp<TextStyle>;
}

function PaintedUsernameWithPaint({
  displayUsername,
  fallbackColor,
  paint,
  sevenTvPaintDropShadows,
  usernameTextStyle,
}: PaintedUsernameWithPaintProps) {
  const dropShadowMode = sevenTvPaintDropShadows;
  const paintTextStyle = buildPaintUsernameTextStyle(paint);
  const dropShadows = getPaintDropShadows(paint, dropShadowMode);
  const textShadows = getPaintTextShadows(paint);
  const stroke = getPaintTextStroke(paint);

  const maskTextStyle = [
    styles.maskText,
    usernameTextStyle,
    paintTextStyle,
  ] as StyleProp<TextStyle>;

  // Layer order mirrors the extension's CSS compositing: drop-shadow filter
  // furthest back, then text-shadows, then the stroke, then the painted fill.
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
          // Static, never-reordered list; index disambiguates identical shadows.
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
  fallbackColor = '#FFFFFF',
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
  const isScrolling = useChatScrollActive();

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

  // During an active fling, render the username in its dominant solid colour
  // and skip the per-row MaskedView offscreen pass + gradient/SVG/image fill
  // layers; the full painted fill returns when the list settles (~150ms),
  // mirroring how animated emotes pause decode during scroll. This sheds the
  // offscreen render passes at the moment the Core Animation render encoder is
  // most pressured (FOAM-TV-MOBILE-BJ render-commit OOM).
  if (isScrolling) {
    return (
      <Text
        style={[
          styles.plainUsername,
          { color: solidFallback },
          usernameTextStyle,
        ]}
      >
        {displayUsername}
      </Text>
    );
  }

  return (
    <PaintedUsernameWithPaint
      displayUsername={displayUsername}
      fallbackColor={solidFallback}
      paint={paint}
      sevenTvPaintDropShadows={sevenTvPaintDropShadows}
      usernameTextStyle={usernameTextStyle}
    />
  );
}

const styles = StyleSheet.create({
  maskText: {
    ...chatLineMetrics.comfortable,
    color: 'black',
    fontWeight: 'bold',
  },
  paintedWrapper: {
    alignSelf: 'flex-start',
    position: 'relative',
  },
  plainUsername: {
    ...chatLineMetrics.comfortable,
    fontWeight: 'bold',
  },
});

export const PaintedUsername = memo(PaintedUsernameComponent);
