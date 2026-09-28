// "shape" is the 7TV paint API field (types/seven-tv/cosmetics.ts), not a naming choice.
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

import type { PaintLayerData } from '@app/types/seven-tv/cosmetics';

import { PaintLayerTiledImage } from './paint-layer-tiled-image';
import { buildLayerGradientConfig } from './util/paint-layer/build-layer-gradient-config';
import { getLayerLayoutStyle } from './util/paint-layer/get-layer-layout-style';
import { imageRepeatFromCanvasRepeat } from './util/paint-layer/image-repeat-from-canvas-repeat';
import { isTilingCanvasRepeat } from './util/paint-layer/is-tiling-canvas-repeat';

interface PaintLayerBackgroundProps {
  /**
   * Resolved paint base colour under the layer content, so the layer opacity
   * fades backing and content together.
   */
  baseColor: string;
  layer: PaintLayerData;
  layerIndex: number;
}

type GradientFillProps = {
  gradientConfig: NonNullable<ReturnType<typeof buildLayerGradientConfig>>;
  gradientId: string;
};

/**
 * CSS radial-gradient defaults to farthest-corner sizing, which needs the
 * rendered layer size in pixels to resolve to a true circle.
 */
function RadialGradientFill({
  gradientConfig,
  gradientId,
  isEllipse,
  layerSize,
}: GradientFillProps & {
  isEllipse: boolean;
  layerSize: { width: number; height: number } | null;
}): ReactNode {
  const width = layerSize?.width ?? 0;

  const height = layerSize?.height ?? 0;
  const halfW = width / 2;
  const halfH = height / 2;
  const farthestCorner = Math.hypot(halfW, halfH);
  const rx = isEllipse ? halfW * Math.SQRT2 : farthestCorner;
  const ry = isEllipse ? halfH * Math.SQRT2 : farthestCorner;

  return layerSize ? (
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
}

/**
 * A repeating linear gradient, which the native gradient cannot express.
 */
function LinearGradientSvgFill({
  gradientConfig,
  gradientId,
}: GradientFillProps): ReactNode {
  const { start, end } = gradientConfig;

  return (
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
}

type PaintLayerContentProps = {
  gradientConfig: ReturnType<typeof buildLayerGradientConfig>;
  gradientId: string;
  isAssetPaint: boolean;
  isEllipse: boolean;
  isRadial: boolean;
  layer: PaintLayerBackgroundProps['layer'];
  layerSize: { width: number; height: number } | null;
  setUrlTextureReady: (ready: boolean) => void;
  urlTextureReady: boolean;
  useSvgLinear: boolean;
};

/**
 * Paints one layer's fill. 7TV describes a layer as an image, a radial or
 * linear gradient, or a flat colour, and each needs a different primitive -
 * SVG for the two gradients CSS semantics require, the native gradient
 * otherwise.
 */
function PaintLayerContent({
  gradientConfig,
  gradientId,
  isAssetPaint,
  isEllipse,
  isRadial,
  layer,
  layerSize,
  setUrlTextureReady,
  urlTextureReady,
  useSvgLinear,
}: PaintLayerContentProps): ReactNode {
  if (isAssetPaint) {
    return isTilingCanvasRepeat(layer.canvas_repeat, layer.repeat) ? (
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
  }

  if (!gradientConfig) {
    // Invalid gradient (fewer than two stops): the span keeps only its
    // base-colour backing, like the reference's invalid background-image.
    return null;
  }

  if (isRadial) {
    return (
      <RadialGradientFill
        gradientConfig={gradientConfig}
        gradientId={gradientId}
        isEllipse={isEllipse}
        layerSize={layerSize}
      />
    );
  }
  if (useSvgLinear) {
    return (
      <LinearGradientSvgFill
        gradientConfig={gradientConfig}
        gradientId={gradientId}
      />
    );
  }
  {
    // SAFETY: buildLayerGradientConfig returns null below two stops, so colors and locations both hold at least two entries here.
    return (
      <LinearGradient
        colors={gradientConfig.colors as [string, string, ...string[]]}
        locations={gradientConfig.locations as [number, number, ...number[]]}
        start={gradientConfig.start}
        end={gradientConfig.end}
        style={styles.fill}
      />
    );
  }
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

  const content = (
    <PaintLayerContent
      gradientConfig={gradientConfig}
      gradientId={gradientId}
      isAssetPaint={isAssetPaint}
      isEllipse={isEllipse}
      isRadial={isRadial}
      layer={layer}
      layerSize={layerSize}
      setUrlTextureReady={setUrlTextureReady}
      urlTextureReady={urlTextureReady}
      useSvgLinear={useSvgLinear}
    />
  );

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
