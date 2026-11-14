import {
  Platform,
  type StyleProp,
  StyleSheet,
  type TextStyle,
  View,
} from 'react-native';

import { getChatColorStyle } from '@app/components/chat/util/chatColorStyles';
import type { PaintData } from '@app/types/seven-tv/cosmetics';

import { ChatRowText } from '../ChatRowText';
import { getChatRowTextStyleForProp } from '../util/chatRowTextStyle';
import { chatLineMetrics } from '../util/chatScale';
import { PaintedUsernameDropShadowLayer } from './PaintedUsernameDropShadowLayer';
import { PaintedUsernameMaskedFill } from './PaintedUsernameMaskedFill';
import { PaintedUsernameWebView } from './PaintedUsernameWebView';
import { getPaintDropShadows } from './util/paint-layer/getPaintDropShadows';
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
  usernameTextStyle?: StyleProp<TextStyle>;
  useWebView: boolean;
}

export function PaintedUsernameHostedLayers({
  displayUsername,
  fallbackColor,
  fontSize,
  lineHeight,
  paint,
  plainColor,
  usernameTextStyle,
  useWebView,
}: PaintedUsernameHostedLayersProps) {
  const paintTextStyle = buildPaintUsernameTextStyle(paint);
  const rawTextureUrl = getPaintTextureUrl(paint);

  // Web paints with CSS and never reads this flag. An empty url skips the
  // Skia fetch. Native waits on the WebP sibling, which is what Skia can decode.
  const textureUrl =
    Platform.OS === 'web' || !rawTextureUrl
      ? ''
      : skiaDecodableLayerUrl(rawTextureUrl);

  const textureReady = useSharedPaintAnimationReady(textureUrl);

  const waitingForTexture =
    Platform.OS !== 'web' &&
    paintDependsOnTexture(paint) &&
    (!textureUrl || !textureReady);

  const plainFillColor = getPaintSolidColor(paint) ?? plainColor;

  if (waitingForTexture) {
    return (
      <ChatRowText
        style={getChatRowTextStyleForProp('muted', [
          styles.plainUsername,
          usernameTextStyle,
          paintTextStyle,
          getChatColorStyle(plainFillColor),
        ])}
      >
        {displayUsername}
      </ChatRowText>
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

  const dropShadows = getPaintDropShadows(paint);
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
          // oxlint-disable-next-line react-doctor/no-array-index-as-key -- static list that never reorders
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
  plainUsername: {
    ...chatLineMetrics.comfortable,
    fontWeight: 'bold',
  },
});
