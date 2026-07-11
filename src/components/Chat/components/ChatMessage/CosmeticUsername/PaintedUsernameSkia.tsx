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
  type PaintLayerSlot,
} from './util/skiaPaintedUsernameRasterizer';
import { useSkiaPaintFontProvider } from './util/skiaPaintFonts';

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
 * Overlay frame from `useAnimatedImageValue` — advances on the UI thread for
 * both stretch and tiled URL layers (animated WebP/GIF included).
 */
function TiledPaintLayerOverlay({
  url,
  tile,
  maskNode,
}: {
  url: string;
  tile: NonNullable<PaintImageLayer['tile']>;
  maskNode: ReactNode;
}) {
  const animatedFrame = useAnimatedImageValue(url);

  if (!animatedFrame) {
    return null;
  }

  return (
    <Mask mode='alpha' mask={maskNode}>
      <Fill>
        <ImageShader image={animatedFrame} tx={tile.tx} ty={tile.ty} />
      </Fill>
    </Mask>
  );
}

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

  if (!animatedFrame) {
    return null;
  }

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

function renderUrlLayerOverlay(
  layer: PaintImageLayer,
  index: number,
  maskNode: ReactNode,
): ReactNode {
  if (!maskNode) {
    return null;
  }
  if (layer.tile) {
    return (
      <TiledPaintLayerOverlay
        // Static, never-reordered list
        // eslint-disable-next-line react-doctor/no-array-index-as-key
        key={`url-${index}|${paintImageLayerKey(layer)}`}
        url={layer.url}
        tile={layer.tile}
        maskNode={maskNode}
      />
    );
  }
  if (layer.rect) {
    return (
      <StretchPaintLayerOverlay
        // Static, never-reordered list
        // eslint-disable-next-line react-doctor/no-array-index-as-key
        key={`url-${index}|${paintImageLayerKey(layer)}`}
        url={layer.url}
        rect={layer.rect}
        maskNode={maskNode}
      />
    );
  }
  return null;
}

function renderLayerSlot(
  slot: PaintLayerSlot,
  index: number,
  bitmaps: PaintBitmaps,
  maskNode: ReactNode,
): ReactNode {
  if (slot.kind === 'baked') {
    return (
      <Image
        // Static, never-reordered list
        // eslint-disable-next-line react-doctor/no-array-index-as-key
        key={`baked-${index}`}
        image={slot.image}
        x={0}
        y={0}
        width={bitmaps.width}
        height={bitmaps.height}
        fit='fill'
      />
    );
  }
  return renderUrlLayerOverlay(slot.layer, index, maskNode);
}

/**
 * Foundation → back-to-front layer slots (URL overlays interleaved with baked
 * gradients) → stroke on top so CSS stacking and -webkit-text-stroke hold.
 */
function ImageLayerPaintCanvas({ bitmaps }: { bitmaps: PaintBitmaps }) {
  const { width, height, insets, staticImage, layerSlots, strokeImage } =
    bitmaps;
  const maskNode = paintMaskNode(bitmaps);

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
      {layerSlots.map((slot, index) =>
        renderLayerSlot(slot, index, bitmaps, maskNode),
      )}
      {strokeImage ? (
        <Image
          image={strokeImage}
          x={0}
          y={0}
          width={width}
          height={height}
          fit='fill'
        />
      ) : null}
    </Canvas>
  );
}

function PaintBitmapCanvas({ bitmaps }: { bitmaps: PaintBitmaps }) {
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
    </Canvas>
  );
}

/**
 * Renders a painted username with Skia. The foundation (shadows, base fill) is
 * baked once; URL textures animate on the UI thread in z-order with any
 * gradients that stack above them, and stroke composites last.
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
