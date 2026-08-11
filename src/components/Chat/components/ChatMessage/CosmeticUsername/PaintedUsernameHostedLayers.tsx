import { type StyleProp, StyleSheet, TextStyle, View } from 'react-native';

import { useChatScrollActive } from '@app/components/Chat/hooks/useChatScrollActive';
import { Text } from '@app/components/ui/Text/Text';
import type { PaintData } from '@app/types/seventv/cosmetics';

import { chatLineMetrics } from '../chatScale';
import { PaintedUsernameDropShadowLayer } from './PaintedUsernameDropShadowLayer';
import { PaintedUsernameMaskedFill } from './PaintedUsernameMaskedFill';
import { PaintedUsernameWebView } from './PaintedUsernameWebView';
import {
  getPaintDropShadows,
  type PaintDropShadowMode,
} from './util/paintLayer/getPaintDropShadows';
import { getPaintSolidColor } from './util/paintLayer/getPaintSolidColor';
import {
  getPaintTextureUrl,
  paintDependsOnTexture,
} from './util/paintLayer/paintDependsOnTexture';
import { paintShadowKey } from './util/paintLayer/paintShadowKey';
import { buildPaintUsernameTextStyle } from './util/paintTextStyle/buildPaintUsernameTextStyle';
import { getPaintTextShadows } from './util/paintTextStyle/getPaintTextShadows';
import { getPaintTextStroke } from './util/paintTextStyle/getPaintTextStroke';
import { paintStrokeToShadow } from './util/paintTextStyle/paintStrokeToShadow';
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
 * The renderers that hang native views off every painted row: a WKWebView per
 * name, or a MaskedView over a stack of gradient and image layers. Both shed
 * to a solid paint colour while the list is flinging, when the render encoder
 * is most pressured (FOAM-TV-MOBILE-BJ), and return ~150ms after it settles.
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

  const maskTextStyle = [
    styles.maskText,
    usernameTextStyle,
    paintTextStyle,
  ] as StyleProp<TextStyle>;

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
