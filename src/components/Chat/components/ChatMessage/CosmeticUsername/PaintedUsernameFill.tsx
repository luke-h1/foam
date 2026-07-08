import { type StyleProp, StyleSheet, TextStyle, View } from 'react-native';

import { Text } from '@app/components/ui/Text/Text';
import type { PaintData } from '@app/types/seventv/cosmetics';
import { sevenTvColorToCss } from '@app/utils/color/sevenTvColorToCss';

import { PaintLayerBackground } from './PaintLayerBackground';
import { getPaintLayers } from './util/paintLayer';

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
  let baseColor = fallbackColor;
  if (paint.color !== null) {
    baseColor = sevenTvColorToCss(paint.color);
  } else if (layers.some(layer => layer.function === 'URL')) {
    baseColor = fallbackColor;
  } else if (layers.length > 0) {
    baseColor = 'transparent';
  }

  return (
    <View style={styles.stack}>
      <View style={[styles.baseColor, { backgroundColor: baseColor }]} />
      {[...layers].reverse().map((layer, index) => (
        <PaintLayerBackground
          key={`${layer.function}-${layer.angle}-${index}`}
          fallbackColor={fallbackColor}
          layer={layer}
          layerIndex={index}
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
