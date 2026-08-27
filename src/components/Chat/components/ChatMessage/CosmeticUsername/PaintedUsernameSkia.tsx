import {
  type ReactNode,
  use,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
} from 'react';
import { PixelRatio } from 'react-native';

import {
  Canvas,
  Fill,
  Group,
  Image,
  ImageShader,
  Mask,
  Skia,
  useCanvasRef,
} from '@shopify/react-native-skia';

import { chatLineMetrics } from '@app/components/Chat/components/ChatMessage/chatScale';
import { Text } from '@app/components/ui/Text/Text';
import { theme } from '@app/styles/themes';
import type { PaintData } from '@app/types/seventv/cosmetics';
import {
  releasePaintBitmaps,
  retainPaintBitmaps,
} from '@app/utils/image/paintBitmapCacheLifecycle';

import { RowVisibilityContext } from '../rowVisibility';
import {
  getPaintTextureUrl,
  paintDependsOnTexture,
} from './util/paintLayer/paintDependsOnTexture';
import {
  useSharedPaintAnimationFrame,
  useSharedPaintAnimationReady,
} from './util/sharedPaintAnimationFrames';
import {
  getPaintBitmaps,
  type PaintBitmaps,
  type PaintImageLayer,
  type PaintLayerSlot,
  urlSlotNeedsBacking,
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

function useCanvasRedrawOnVisible() {
  const canvasRef = useCanvasRef();
  const rowVisibility = use(RowVisibilityContext);
  useEffect(() => {
    const frame = requestAnimationFrame(() => canvasRef.current?.redraw());
    const unsubscribe = rowVisibility?.subscribe(() => {
      if (rowVisibility.isVisible()) {
        canvasRef.current?.redraw();
      }
    });
    return () => {
      cancelAnimationFrame(frame);
      unsubscribe?.();
    };
  }, [canvasRef, rowVisibility]);
  return canvasRef;
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
 * Overlay frame from the shared per-URL animation clock - advances on the UI
 * thread, in phase with every other row using the same paint texture.
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
  const textureReady = useSharedPaintAnimationReady(url);
  const animatedFrame = useSharedPaintAnimationFrame(url);

  if (!textureReady) {
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
  const textureReady = useSharedPaintAnimationReady(url);
  const animatedFrame = useSharedPaintAnimationFrame(url);

  if (!textureReady) {
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
    layer.opacity,
  ].join('|');
}

function renderUrlLayerOverlay(
  layer: PaintImageLayer,
  maskNode: ReactNode,
): ReactNode {
  if (!maskNode) {
    return null;
  }
  if (layer.tile) {
    return (
      <TiledPaintLayerOverlay
        url={layer.url}
        tile={layer.tile}
        maskNode={maskNode}
      />
    );
  }
  if (layer.rect) {
    return (
      <StretchPaintLayerOverlay
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
  const overlay = renderUrlLayerOverlay(slot.layer, maskNode);
  if (!overlay) {
    return null;
  }
  const needsBacking = urlSlotNeedsBacking(index, slot.layer);
  return (
    <UrlLayerSpan
      // Static, never-reordered list
      // eslint-disable-next-line react-doctor/no-array-index-as-key
      key={`url-${index}|${paintImageLayerKey(slot.layer)}`}
      opacity={slot.layer.opacity}
    >
      {needsBacking && bitmaps.backingImage ? (
        <Image
          image={bitmaps.backingImage}
          x={0}
          y={0}
          width={bitmaps.width}
          height={bitmaps.height}
          fit='fill'
        />
      ) : null}
      {overlay}
    </UrlLayerSpan>
  );
}

/**
 * One URL layer span: `layer` forces a real saveLayer so the fade applies to
 * the flattened span, not to backing and texture independently.
 */
function UrlLayerSpan({
  opacity,
  children,
}: {
  opacity: number;
  children: ReactNode;
}) {
  const layerPaint = useMemo(() => {
    if (opacity >= 1) {
      return false;
    }
    const paint = Skia.Paint();
    paint.setAlphaf(opacity);
    return paint;
  }, [opacity]);

  return <Group layer={layerPaint}>{children}</Group>;
}

/**
 * Foundation → back-to-front layer slots (URL overlays interleaved with baked
 * gradients) → stroke on top so CSS stacking and -webkit-text-stroke hold.
 */
function ImageLayerPaintCanvas({ bitmaps }: { bitmaps: PaintBitmaps }) {
  const { width, height, insets, staticImage, layerSlots, strokeImage } =
    bitmaps;
  const maskNode = paintMaskNode(bitmaps);
  const canvasRef = useCanvasRedrawOnVisible();

  return (
    <Canvas
      ref={canvasRef}
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
  const canvasRef = useCanvasRedrawOnVisible();

  return (
    <Canvas
      ref={canvasRef}
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
 * Renders a painted username with Skia: foundation baked once, URL textures
 * animate on the UI thread, stroke composites last.
 */
export function PaintedUsernameSkia({
  username,
  paint,
  fallbackColor = theme.color.text.dark,
  fontSize = chatLineMetrics.comfortable.fontSize,
}: PaintedUsernameSkiaProps) {
  const fontProvider = useSkiaPaintFontProvider();
  const pixelRatio = PixelRatio.get();
  const [rebuildToken, setRebuildToken] = useState(0);
  const textureUrl = getPaintTextureUrl(paint);
  const textureReady = useSharedPaintAnimationReady(textureUrl ?? '');

  const bitmaps = useMemo(() => {
    // rebuildToken re-reads the cache after a lost retain; referenced so the
    // dep is legitimate without a lint disable.
    void rebuildToken;
    return fontProvider
      ? getPaintBitmaps({
          displayUsername: username,
          paint,
          fallbackColor,
          fontSize,
          pixelRatio,
          fontProvider,
          fontFamily: 'Montserrat',
        })
      : null;
  }, [
    fontProvider,
    username,
    paint,
    fallbackColor,
    fontSize,
    pixelRatio,
    rebuildToken,
  ]);

  /**
   * Pins the textures while the canvas draws them so eviction cannot dispose
   * an on-screen bitmap; layout effect so the retain lands in the same commit.
   */
  useLayoutEffect(() => {
    if (!bitmaps) {
      return;
    }
    if (!retainPaintBitmaps(bitmaps)) {
      // react-doctor-disable-next-line react-hooks-js/set-state-in-effect -- recovery branch: runs only when disposal beat this retain
      setRebuildToken(token => token + 1);
      return;
    }
    return () => releasePaintBitmaps(bitmaps);
  }, [bitmaps]);

  if (
    !bitmaps ||
    (paintDependsOnTexture(paint) && (!textureUrl || !textureReady))
  ) {
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
