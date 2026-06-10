import type { PaintLayerData } from '@app/utils/color/seventv-ws-service';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import { type LayoutChangeEvent, StyleSheet, View } from 'react-native';
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
  const [layerSize, setLayerSize] = useState<{
    width: number;
    height: number;
  } | null>(null);
  const layoutStyle = getLayerLayoutStyle(layer);
  const gradientConfig = buildLayerGradientConfig(layer, fallbackColor);
  const isRadial = layer.function === 'RADIAL_GRADIENT';
  const isAssetPaint = layer.function === 'URL' && Boolean(layer.image_url);
  const isEllipse = layer.shape === 'ellipse';
  const useSvgLinear = layer.function === 'LINEAR_GRADIENT' && layer.repeat;

  const handleLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    if (
      width > 0 &&
      height > 0 &&
      (layerSize?.width !== width || layerSize?.height !== height)
    ) {
      setLayerSize({ width, height });
    }
  };

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
    // CSS radial-gradient default sizing is farthest-corner, which needs the
    // rendered layer size in pixels to resolve to a true circle.
    const width = layerSize?.width ?? 0;
    const height = layerSize?.height ?? 0;
    const halfW = width / 2;
    const halfH = height / 2;
    const farthestCorner = Math.hypot(halfW, halfH);
    const rx = isEllipse ? halfW * Math.SQRT2 : farthestCorner;
    const ry = isEllipse ? halfH * Math.SQRT2 : farthestCorner;

    return (
      <View style={[styles.layer, layoutStyle]} onLayout={handleLayout}>
        {layerSize ? (
          <Svg width='100%' height='100%' style={styles.fill}>
            <Defs>
              <SvgRadialGradient
                id={`${gradientId}-radial`}
                gradientUnits='userSpaceOnUse'
                cx={halfW}
                cy={halfH}
                rx={rx}
                ry={ry}
                fx={halfW}
                fy={halfH}
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
        ) : null}
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
