import { sevenTvColorToCss } from '@app/utils/color/sevenTvColorToCss';
import type { PaintData } from '@app/utils/color/seventv-ws-service';
import { type StyleProp, StyleSheet, TextStyle, View } from 'react-native';
import { Text } from '@app/components/ui/Text/Text';
import { PaintLayerBackground } from './PaintLayerBackground';
import { getPaintLayers } from './util/paintLayer';

interface PaintedUsernameFillProps {
  displayUsername: string;
  fallbackColor: string;
  paint: PaintData;
  usernameTextStyle?: StyleProp<TextStyle>;
}

export function PaintedUsernameFill({
  displayUsername,
  fallbackColor,
  paint,
  usernameTextStyle,
}: PaintedUsernameFillProps) {
  const layers = getPaintLayers(paint);
  const baseColor =
    paint.color === null ? fallbackColor : sevenTvColorToCss(paint.color);

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
      <Text style={[styles.hiddenText, usernameTextStyle]}>
        {displayUsername}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  baseColor: {
    ...StyleSheet.absoluteFill,
  },
  hiddenText: {
    fontWeight: 'bold',
    opacity: 0,
  },
  stack: {
    flexDirection: 'row',
    position: 'relative',
  },
});
