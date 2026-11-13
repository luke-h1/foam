import { type StyleProp, StyleSheet, type TextStyle, View } from 'react-native';

import type { PaintData } from '@app/types/seven-tv/cosmetics';

import { ChatRowText } from '../ChatRowText';
import { getChatRowTextStyleForProp } from '../util/chatRowTextStyle';
import { PaintLayerBackground } from './PaintLayerBackground';
import { getPaintBaseColor } from './util/paint-layer/getPaintBaseColor';
import { getPaintLayers } from './util/paint-layer/getPaintLayers';
import { isRenderablePaintLayer } from './util/paint-layer/isRenderablePaintLayer';
import { withPaintLayerKeys } from './util/paint-layer/paintLayerKey';

interface PaintedUsernameFillProps {
  displayUsername: string;
  fallbackColor: string;
  paint: PaintData;
  /**
   * Must match the mask text style exactly (metrics, weight, transform) so
   * the fill sizer reserves the same space the mask glyphs occupy.
   */
  textStyle?: StyleProp<TextStyle>;
}

export function PaintedUsernameFill({
  displayUsername,
  fallbackColor,
  paint,
  textStyle,
}: PaintedUsernameFillProps) {
  const layers = getPaintLayers(paint).filter(isRenderablePaintLayer);
  const keyedLayers = withPaintLayerKeys([...layers].reverse());

  const baseColor = getPaintBaseColor(paint, fallbackColor);

  return (
    <View style={styles.stack}>
      <View
        testID='painted-username-base-fill'
        style={[styles.baseColor, { backgroundColor: baseColor }]}
      />
      {keyedLayers.map(({ layer, key, layerIndex }) => (
        <PaintLayerBackground key={key} layer={layer} layerIndex={layerIndex} />
      ))}
      <ChatRowText
        style={getChatRowTextStyleForProp('muted', [
          textStyle,
          styles.hiddenText,
        ])}
      >
        {displayUsername}
      </ChatRowText>
    </View>
  );
}

const styles = StyleSheet.create({
  baseColor: {
    ...StyleSheet.absoluteFill,
  },
  hiddenText: {
    opacity: 0,
  },
  stack: {
    flexDirection: 'row',
    position: 'relative',
  },
});
