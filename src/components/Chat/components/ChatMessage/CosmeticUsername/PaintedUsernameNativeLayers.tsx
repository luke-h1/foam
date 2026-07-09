import { type StyleProp, StyleSheet, TextStyle, View } from 'react-native';

import { chatLineMetrics } from '../RichChatMessage.styles';
import { PaintedUsernameDropShadowLayer } from './PaintedUsernameDropShadowLayer';
import { PaintedUsernameMaskedFill } from './PaintedUsernameMaskedFill';
import { usePaintedUsernameRenderContext } from './PaintedUsernameRenderContext';
import { PaintedUsernameStrokeLayer } from './PaintedUsernameStrokeLayer';
import { getPaintDropShadows, paintShadowKey } from './util/paintLayer';
import {
  buildPaintUsernameTextStyle,
  getPaintTextShadows,
  getPaintTextStroke,
  scaleNativeDropShadow,
} from './util/paintTextStyle';

/**
 * Native fallback for painted usernames when CSS `filter` / `background-clip`
 * cannot be applied by @native-html/render on iOS and Android.
 */
export function PaintedUsernameNativeLayers() {
  const context = usePaintedUsernameRenderContext();
  if (!context) {
    return null;
  }

  const {
    displayUsername,
    fallbackColor,
    paint,
    sevenTvPaintDropShadows,
    usernameTextStyle,
  } = context;

  const paintTextStyle = buildPaintUsernameTextStyle(paint);
  const dropShadows = getPaintDropShadows(paint, sevenTvPaintDropShadows).map(
    scaleNativeDropShadow,
  );
  const textShadows = getPaintTextShadows(paint);
  const stroke = getPaintTextStroke(paint);

  const maskTextStyle = [
    styles.maskText,
    usernameTextStyle,
    paintTextStyle,
  ] as StyleProp<TextStyle>;

  const underlayShadows = [
    ...dropShadows.map(shadow => ({ shadow, source: 'drop' as const })),
    ...textShadows.map(shadow => ({ shadow, source: 'text' as const })),
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
      {stroke ? (
        <PaintedUsernameStrokeLayer
          displayUsername={displayUsername}
          maskTextStyle={maskTextStyle}
          stroke={stroke}
        />
      ) : null}
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
    overflow: 'visible',
    position: 'relative',
  },
});
