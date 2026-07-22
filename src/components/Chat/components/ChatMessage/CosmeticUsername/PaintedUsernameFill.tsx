import { type StyleProp, StyleSheet, TextStyle, View } from 'react-native';

import { Text } from '@app/components/ui/Text/Text';
import type { PaintData } from '@app/types/seventv/cosmetics';
import { sevenTvColorToCss } from '@app/utils/color/sevenTvColorToCss';

import { PaintLayerBackground } from './PaintLayerBackground';
import { getPaintLayers } from './util/paintLayer/getPaintLayers';
import { withPaintLayerKeys } from './util/paintLayer/paintLayerKey';

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
  const layers = getPaintLayers(paint);
  const keyedLayers = withPaintLayerKeys(layers.toReversed());
  const baseColor =
    paint.color === null ? fallbackColor : sevenTvColorToCss(paint.color);

  return (
    <View style={styles.stack}>
      <View style={[styles.baseColor, { backgroundColor: baseColor }]} />
      {keyedLayers.map(({ layer, key, layerIndex }) => (
        <PaintLayerBackground
          key={key}
          fallbackColor={fallbackColor}
          layer={layer}
          layerIndex={layerIndex}
        />
      ))}
      <Text style={[textStyle, styles.hiddenText]}>{displayUsername}</Text>
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
