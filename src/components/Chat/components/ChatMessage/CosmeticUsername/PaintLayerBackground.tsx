// "shape" is the 7TV paint API field (types/seventv/cosmetics.ts), not a naming choice.
// oxlint-disable anti-slop/no-shape-in-symbol-names
import { type ReactNode, useState } from 'react';
import { type LayoutChangeEvent, StyleSheet, View } from 'react-native';
import Svg, {
  Defs,
  LinearGradient as SvgLinearGradient,
  RadialGradient as SvgRadialGradient,
  Rect,
  Stop,
} from 'react-native-svg';

import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';

import type { PaintLayerData } from '@app/types/seventv/cosmetics';

import { PaintLayerTiledImage } from './PaintLayerTiledImage';
import { buildLayerGradientConfig } from './util/paintLayer/buildLayerGradientConfig';
import { getLayerLayoutStyle } from './util/paintLayer/getLayerLayoutStyle';
import { imageRepeatFromCanvasRepeat } from './util/paintLayer/imageRepeatFromCanvasRepeat';
import { isTilingCanvasRepeat } from './util/paintLayer/isTilingCanvasRepeat';

interface PaintLayerBackgroundProps {
  /**
   * Resolved paint base colour under the layer content, so the layer opacity
   * fades backing and content together.
   */
  baseColor: string;
  layer: PaintLayerData;
  layerIndex: number;
}

export function PaintLayerBackground({
  baseColor,
  layer,
  layerIndex,
}: PaintLayerBackgroundProps) {
  const gradientId = `paint-layer-${layerIndex}`;
  const [layerSize, setLayerSize] = useState<{
    width: number;
    height: number;
  } | null>(null);
  const [urlTextureReady, setUrlTextureReady] = useState(false);
  const layoutStyle = getLayerLayoutStyle(layer);
  const layerOpacity = layer.opacity;
  const gradientConfig = buildLayerGradientConfig(layer);
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

  let content: ReactNode;
  if (isAssetPaint) {
    content = isTilingCanvasRepeat(layer.canvas_repeat, layer.repeat) ? (
      <PaintLayerTiledImage
        canvasRepeat={layer.canvas_repeat}
        imageUrl={layer.image_url}
      />
    ) : (
      <Image
        contentFit={imageRepeatFromCanvasRepeat(
          layer.canvas_repeat,
          layer.repeat,
        )}
        source={{ uri: layer.image_url }}
        useAppleWebpCodec={false}
        style={urlTextureReady ? styles.fill : styles.unloadedTexture}
        onLoad={() => setUrlTextureReady(true)}
        onError={() => setUrlTextureReady(false)}
      />
    );
  } else if (!gradientConfig) {
    // Invalid gradient (fewer than two stops): the span keeps only its
    // base-colour backing, like the reference's invalid background-image.
    content = null;
  } else if (isRadial) {
    // CSS radial-gradient default sizing is farthest-corner, which needs the
    // rendered layer size in pixels to resolve to a true circle.
    const width = layerSize?.width ?? 0;
    const height = layerSize?.height ?? 0;
    const halfW = width / 2;
    const halfH = height / 2;
    const farthestCorner = Math.hypot(halfW, halfH);
    const rx = isEllipse ? halfW * Math.SQRT2 : farthestCorner;
    const ry = isEllipse ? halfH * Math.SQRT2 : farthestCorner;

    content = layerSize ? (
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
    ) : null;
  } else if (useSvgLinear) {
    const { start, end } = gradientConfig;
    content = (
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
    );
  } else {
    // SAFETY: buildLayerGradientConfig returns null below two stops, so colors and locations both hold at least two entries here.
    content = (
      <LinearGradient
        colors={gradientConfig.colors as [string, string, ...string[]]}
        locations={gradientConfig.locations as [number, number, ...number[]]}
        start={gradientConfig.start}
        end={gradientConfig.end}
        style={styles.fill}
      />
    );
  }

  return (
    <View
      style={[
        styles.span,
        { backgroundColor: baseColor },
        layerOpacity < 1 ? { opacity: layerOpacity } : null,
      ]}
    >
      <View
        style={[styles.layer, layoutStyle]}
        onLayout={isRadial ? handleLayout : undefined}
      >
        {content}
      </View>
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
  span: {
    ...StyleSheet.absoluteFill,
  },
  unloadedTexture: {
    height: 0,
    opacity: 0,
    width: 0,
  },
});
