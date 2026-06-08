import { Image } from '@app/components/Image/Image';
import type { PaintLayerData } from '@app/utils/color/seventv-ws-service';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View } from 'react-native';
import Svg, {
  Defs,
  LinearGradient as SvgLinearGradient,
  RadialGradient as SvgRadialGradient,
  Rect,
  Stop,
} from 'react-native-svg';
import {
  buildLayerGradientConfig,
  getLayerLayoutStyle,
  imageRepeatFromCanvasRepeat,
} from './util/paintLayer';

interface PaintLayerBackgroundProps {
  fallbackColor: string;
  layer: PaintLayerData;
  layerIndex: number;
}

export function PaintLayerBackground({
  layer,
  fallbackColor,
  layerIndex,
}: PaintLayerBackgroundProps) {
  const gradientId = `paint-layer-${layerIndex}`;
  const layoutStyle = getLayerLayoutStyle(layer);
  const gradientConfig = buildLayerGradientConfig(layer, fallbackColor);
  const isRadial = layer.function === 'RADIAL_GRADIENT';
  const isAssetPaint = layer.function === 'URL' && Boolean(layer.image_url);
  const isEllipse = layer.shape === 'ellipse';
  const useSvgLinear = layer.function === 'LINEAR_GRADIENT' && layer.repeat;

  if (isAssetPaint) {
    return (
      <View style={[styles.layer, layoutStyle]}>
        <Image
          contentFit={imageRepeatFromCanvasRepeat(
            layer.canvas_repeat,
            layer.repeat,
          )}
          source={{ uri: layer.image_url }}
          style={styles.fill}
        />
      </View>
    );
  }

  if (isRadial) {
    return (
      <View style={[styles.layer, layoutStyle]}>
        <Svg width='100%' height='100%' style={styles.fill}>
          <Defs>
            <SvgRadialGradient
              id={`${gradientId}-radial`}
              cx='50%'
              cy='50%'
              rx='50%'
              ry={isEllipse ? '25%' : '50%'}
              fx='50%'
              fy='50%'
            >
              {gradientConfig.colors.map((color, index) => (
                <Stop
                  key={`${color}-${gradientConfig.locations[index]}`}
                  offset={`${(gradientConfig.locations[index] ?? 0) * 100}%`}
                  stopColor={color}
                />
              ))}
            </SvgRadialGradient>
          </Defs>
          <Rect
            x='0'
            y='0'
            width='100%'
            height='100%'
            fill={`url(#${gradientId}-radial)`}
          />
        </Svg>
      </View>
    );
  }

  if (useSvgLinear) {
    const { start, end } = gradientConfig;
    return (
      <View style={[styles.layer, layoutStyle]}>
        <Svg width='100%' height='100%' style={styles.fill}>
          <Defs>
            <SvgLinearGradient
              id={`${gradientId}-linear`}
              x1={`${start.x * 100}%`}
              y1={`${start.y * 100}%`}
              x2={`${end.x * 100}%`}
              y2={`${end.y * 100}%`}
            >
              {gradientConfig.colors.map((color, index) => (
                <Stop
                  key={`${color}-${gradientConfig.locations[index]}`}
                  offset={`${(gradientConfig.locations[index] ?? 0) * 100}%`}
                  stopColor={color}
                />
              ))}
            </SvgLinearGradient>
          </Defs>
          <Rect
            x='0'
            y='0'
            width='100%'
            height='100%'
            fill={`url(#${gradientId}-linear)`}
          />
        </Svg>
      </View>
    );
  }

  return (
    <View style={[styles.layer, layoutStyle]}>
      <LinearGradient
        colors={gradientConfig.colors as [string, string, ...string[]]}
        locations={gradientConfig.locations as [number, number, ...number[]]}
        start={gradientConfig.start}
        end={gradientConfig.end}
        style={styles.fill}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  fill: {
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  layer: {
    overflow: 'hidden',
  },
});
