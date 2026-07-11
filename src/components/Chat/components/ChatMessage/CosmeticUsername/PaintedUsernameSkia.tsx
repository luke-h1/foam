import { type ReactNode, useMemo } from 'react';
import { PixelRatio } from 'react-native';

import {
  Canvas,
  Fill,
  Image,
  ImageShader,
  Mask,
  useAnimatedImageValue,
} from '@shopify/react-native-skia';

import { chatLineMetrics } from '@app/components/Chat/components/ChatMessage/RichChatMessage.styles';
import { Text } from '@app/components/ui/Text/Text';
import { theme } from '@app/styles/themes';
import type { PaintData } from '@app/types/seventv/cosmetics';

import {
  getPaintBitmaps,
  type PaintBitmaps,
  type PaintImageLayer,
} from './util/skiaPaintedUsernameRasterizer';
import { useSkiaPaintFontProvider } from './util/skiaPaintFonts';
import { useTiledPaintImage } from './util/tiledPaintImageCache';

interface PaintedUsernameSkiaProps {
  username: string;
  paint: PaintData;
  fallbackColor?: string;
  /**
   * Glyph size in points; defaults to the chat row metric. Passed through so
   * painted names render at the right size outside chat (composer, user card).
   */
  fontSize?: number;
}

function paintMaskNode(bitmaps: PaintBitmaps): ReactNode {
  if (!bitmaps.maskImage) {
    return null;
  }
  return (
    <Image
      image={bitmaps.maskImage}
      x={0}
      y={0}
      width={bitmaps.width}
      height={bitmaps.height}
      fit='fill'
    />
  );
}

/**
 * Canvas for a resolved paint: the cached static composite as one bitmap, plus
 * (for image-layer paints) the texture overlay passed in by the wrappers
 * below. Negative margins collapse the shadow overflow margin so the glyphs
 * align with neighbouring text.
 */
function PaintBitmapCanvas({
  bitmaps,
  overlay,
}: {
  bitmaps: PaintBitmaps;
  overlay?: ReactNode;
}) {
  const { width, height, insets, staticImage } = bitmaps;

  return (
    <Canvas
      style={{
        width,
        height,
        marginLeft: -insets.left,
        marginTop: -insets.top,
        marginRight: -insets.right,
        marginBottom: -insets.bottom,
      }}
    >
      <Image
        image={staticImage}
        x={0}
        y={0}
        width={width}
        height={height}
        fit='fill'
      />
      {overlay}
    </Canvas>
  );
}

function TiledPaintLayerOverlay({
  url,
  tile,
  maskNode,
}: {
  url: string;
  tile: NonNullable<PaintImageLayer['tile']>;
  maskNode: ReactNode;
}) {
  const tiledImage = useTiledPaintImage(url);

  if (!tiledImage) {
    return null;
  }

  return (
    <Mask mode='alpha' mask={maskNode}>
      <Fill>
        <ImageShader image={tiledImage} tx={tile.tx} ty={tile.ty} />
      </Fill>
    </Mask>
  );
}

/**
 * The overlay frame comes from `useAnimatedImageValue`, which advances on the
 * UI thread, so animated paints animate at the texture's own frame rate with
 * no per-frame JS and no re-rasterizing. Its Reanimated frame callback runs
 * every frame for as long as the component is mounted, which is why this
 * wrapper only mounts for stretch-rendered image layers.
 */
function StretchPaintLayerOverlay({
  url,
  rect,
  maskNode,
}: {
  url: string;
  rect: NonNullable<PaintImageLayer['rect']>;
  maskNode: ReactNode;
}) {
  const animatedFrame = useAnimatedImageValue(url);

  return (
    <Mask mode='alpha' mask={maskNode}>
      <Image
        image={animatedFrame}
        x={rect.x}
        y={rect.y}
        width={rect.width}
        height={rect.height}
        fit='fill'
      />
    </Mask>
  );
}

function paintImageLayerKey(layer: PaintImageLayer): string {
  return [
    layer.url,
    layer.tile ? `${layer.tile.tx},${layer.tile.ty}` : '',
    layer.rect
      ? `${layer.rect.x},${layer.rect.y},${layer.rect.width},${layer.rect.height}`
      : '',
  ].join('|');
}

function renderPaintImageLayerOverlay(
  layer: PaintImageLayer,
  maskNode: ReactNode,
): ReactNode {
  if (layer.tile) {
    return (
      <TiledPaintLayerOverlay
        key={paintImageLayerKey(layer)}
        url={layer.url}
        tile={layer.tile}
        maskNode={maskNode}
      />
    );
  }
  if (layer.rect) {
    return (
      <StretchPaintLayerOverlay
        key={paintImageLayerKey(layer)}
        url={layer.url}
        rect={layer.rect}
        maskNode={maskNode}
      />
    );
  }
  return null;
}

function ImageLayerPaintCanvas({ bitmaps }: { bitmaps: PaintBitmaps }) {
  const maskNode = paintMaskNode(bitmaps);

  const overlay = maskNode
    ? bitmaps.imageLayers.map(layer =>
        renderPaintImageLayerOverlay(layer, maskNode),
      )
    : null;

  return <PaintBitmapCanvas bitmaps={bitmaps} overlay={overlay} />;
}

/**
 * Renders a painted username with Skia. The static composite (gradients, base
 * fill, drop shadows) is baked once into a cached bitmap and reused across
 * mounts and every user wearing the paint; image-layer paints animate their
 * texture on the UI thread.
 */
export function PaintedUsernameSkia({
  username,
  paint,
  fallbackColor = theme.color.text.dark,
  fontSize = chatLineMetrics.comfortable.fontSize,
}: PaintedUsernameSkiaProps) {
  const fontProvider = useSkiaPaintFontProvider();
  const pixelRatio = PixelRatio.get();

  const bitmaps = useMemo(
    () =>
      fontProvider
        ? getPaintBitmaps({
            displayUsername: username,
            paint,
            fallbackColor,
            fontSize,
            pixelRatio,
            fontProvider,
            fontFamily: 'Montserrat',
          })
        : null,
    [fontProvider, username, paint, fallbackColor, fontSize, pixelRatio],
  );

  if (!bitmaps) {
    return (
      <Text
        style={{
          ...chatLineMetrics.comfortable,
          fontSize,
          fontWeight: 'bold',
          color: fallbackColor,
        }}
      >
        {username}
      </Text>
    );
  }

  if (bitmaps.imageLayers.length > 0) {
    return <ImageLayerPaintCanvas bitmaps={bitmaps} />;
  }

  return <PaintBitmapCanvas bitmaps={bitmaps} />;
}
