import {
  Platform,
  type StyleProp,
  StyleSheet,
  type TextStyle,
  View,
} from 'react-native';

import { ChatText } from '@app/components/chat/components/chat-text/ChatText';
import { useChatScrollActive } from '@app/components/chat/hooks/use-chat-scroll-active';
import type { PaintData } from '@app/types/seven-tv/cosmetics';

import { chatLineMetrics } from '../util/chatScale';
import { PaintedUsernameDropShadowLayer } from './PaintedUsernameDropShadowLayer';
import { PaintedUsernameMaskedFill } from './PaintedUsernameMaskedFill';
import { PaintedUsernameWebView } from './PaintedUsernameWebView';
import {
  getPaintDropShadows,
  type PaintDropShadowMode,
} from './util/paint-layer/getPaintDropShadows';
import { getPaintSolidColor } from './util/paint-layer/getPaintSolidColor';
import {
  getPaintTextureUrl,
  paintDependsOnTexture,
} from './util/paint-layer/paintDependsOnTexture';
import { paintShadowKey } from './util/paint-layer/paintShadowKey';
import { skiaDecodableLayerUrl } from './util/paint-layer/skiaDecodableLayerUrl';
import { buildPaintUsernameTextStyle } from './util/paint-text-style/buildPaintUsernameTextStyle';
import { getPaintTextShadows } from './util/paint-text-style/getPaintTextShadows';
import { getPaintTextStroke } from './util/paint-text-style/getPaintTextStroke';
import { paintStrokeToShadow } from './util/paint-text-style/paintStrokeToShadow';
import { useSharedPaintAnimationReady } from './util/sharedPaintAnimationFrames';

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
 * Native sheds this fill to a solid colour while the list is flinging
 * (FOAM-TV-MOBILE-BJ) and restores it ~150ms after the fling settles.
 * Web keeps the CSS paint up the whole time.
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
  const rawTextureUrl = getPaintTextureUrl(paint);

  // Web paints with CSS and never reads this flag. An empty url skips the
  // Skia fetch. Native waits on the WebP sibling, which is what Skia can decode.
  const textureUrl =
    Platform.OS === 'web' || !rawTextureUrl
      ? ''
      : skiaDecodableLayerUrl(rawTextureUrl);

  const textureReady = useSharedPaintAnimationReady(textureUrl);

  // Web draws the paint with CSS, which stays cheap while the list moves.
  // Native sheds the hosted fill during a fling (FOAM-TV-MOBILE-BJ).
  const shedWhileScrolling = Platform.OS !== 'web' && isScrolling;

  const waitingForTexture =
    Platform.OS !== 'web' &&
    paintDependsOnTexture(paint) &&
    (!textureUrl || !textureReady);

  const showPlainColor = shedWhileScrolling || waitingForTexture;

  const plainFillColor = getPaintSolidColor(paint) ?? plainColor;

  if (showPlainColor) {
    return (
      <ChatText
        style={[
          styles.scrollUsername,
          usernameTextStyle,
          paintTextStyle,
          { color: plainFillColor },
        ]}
      >
        {displayUsername}
      </ChatText>
    );
  }

  if (useWebView) {
    return (
      <PaintedUsernameWebView
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
          // eslint-disable-next-line react-doctor/no-array-index-as-key -- static list that never reorders
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
