import { type StyleProp, StyleSheet, TextStyle, View } from 'react-native';

import { useChatScrollActive } from '@app/components/chat/hooks/use-chat-scroll-active';
import { Text } from '@app/components/ui/text/text';
import type { PaintData } from '@app/types/seven-tv/cosmetics';

import { chatLineMetrics } from '../util/chat-scale';
import { PaintedUsernameDropShadowLayer } from './painted-username-drop-shadow-layer';
import { PaintedUsernameMaskedFill } from './painted-username-masked-fill';
import { PaintedUsernameWebView } from './painted-username-web-view';
import {
  getPaintDropShadows,
  type PaintDropShadowMode,
} from './util/paint-layer/get-paint-drop-shadows';
import { getPaintSolidColor } from './util/paint-layer/get-paint-solid-color';
import {
  getPaintTextureUrl,
  paintDependsOnTexture,
} from './util/paint-layer/paint-depends-on-texture';
import { paintShadowKey } from './util/paint-layer/paint-shadow-key';
import { buildPaintUsernameTextStyle } from './util/paint-text-style/build-paint-username-text-style';
import { getPaintTextShadows } from './util/paint-text-style/get-paint-text-shadows';
import { getPaintTextStroke } from './util/paint-text-style/get-paint-text-stroke';
import { paintStrokeToShadow } from './util/paint-text-style/paint-stroke-to-shadow';
import { useSharedPaintAnimationReady } from './util/shared-paint-animation-frames';

interface PaintedUsernameHostedLayersProps {
  displayUsername: string;
  fallbackColor: string;
  fontSize?: number;
  lineHeight?: number;
  paint: PaintData;
  plainColor: string;
  sevenTvPaintDropShadows: PaintDropShadowMode;
  usernameTextStyle?: StyleProp<TextStyle>;
  useWebView: boolean;
}

/**
 * Both renderers shed to a solid paint colour while the list is flinging
 * (FOAM-TV-MOBILE-BJ) and return ~150ms after it settles.
 */
export function PaintedUsernameHostedLayers({
  displayUsername,
  fallbackColor,
  fontSize,
  lineHeight,
  paint,
  plainColor,
  sevenTvPaintDropShadows,
  usernameTextStyle,
  useWebView,
}: PaintedUsernameHostedLayersProps) {
  const isScrolling = useChatScrollActive();
  const paintTextStyle = buildPaintUsernameTextStyle(paint);
  const textureUrl = getPaintTextureUrl(paint);
  const textureReady = useSharedPaintAnimationReady(textureUrl ?? '');

  const showPlainColor =
    isScrolling ||
    (paintDependsOnTexture(paint) && (!textureUrl || !textureReady));

  const plainFillColor = getPaintSolidColor(paint) ?? plainColor;

  if (showPlainColor) {
    return (
      <Text
        style={[
          styles.scrollUsername,
          usernameTextStyle,
          paintTextStyle,
          { color: plainFillColor },
        ]}
      >
        {displayUsername}
      </Text>
    );
  }

  if (useWebView) {
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

  const dropShadows = getPaintDropShadows(paint, sevenTvPaintDropShadows);
  const textShadows = getPaintTextShadows(paint);
  const stroke = getPaintTextStroke(paint);

  const maskTextStyle: StyleProp<TextStyle> = [
    styles.maskText,
    usernameTextStyle,
    paintTextStyle,
  ];

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
  scrollUsername: {
    ...chatLineMetrics.comfortable,
    fontWeight: 'bold',
  },
});
