import {
  type ReactNode,
  use,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
} from 'react';
import { PixelRatio, View } from 'react-native';

import {
  Canvas,
  Fill,
  Group,
  Image,
  ImageShader,
  Mask,
  Skia,
  type SkImage,
  useCanvasRef,
} from '@shopify/react-native-skia';

import { chatLineMetrics } from '@app/components/chat/components/chat-message/util/chat-scale';
import { ChatText } from '@app/components/chat/components/chat-text/chat-text';
import { theme } from '@app/styles/themes';
import type { PaintData } from '@app/types/seven-tv/cosmetics';
import {
  releasePaintBitmaps,
  retainPaintBitmaps,
} from '@app/utils/image/paint-bitmap-cache-lifecycle';

import { RowVisibilityContext } from '../util/row-visibility';
import {
  getPaintTextureUrl,
  paintDependsOnTexture,
} from './util/paint-layer/paint-depends-on-texture';
import {
  useSharedPaintAnimationReady,
  useSharedPaintFrames,
} from './util/shared-paint-animation-frames';
import { useSkiaPaintFontProvider } from './util/skia-paint-fonts';
import {
  getPaintBitmaps,
  type PaintBitmaps,
  type PaintImageLayer,
  type PaintLayerSlot,
} from './util/skia-painted-username-rasterizer';

interface PaintedUsernameSkiaProps {
  username: string;
  paint: PaintData;
  fallbackColor?: string;
  /**
   * Glyph size in points; defaults to the chat row metric. Passed through so
   * painted names render at the right size outside chat (composer, user card).
   */
  fontSize?: number;
  /**
   * Chat line box. The bitmap is the glyph height, so the frame centers it
   * on the same line as the message text.
   */
  lineHeight?: number;
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

type PaintFrames = ReadonlyMap<string, SkImage>;

/**
 * Overlay frame from the shared per-URL animation clock. Every row with the
 * same texture shows this frame.
 */
function TiledPaintLayerOverlay({
  frame,
  tile,
  maskNode,
}: {
  frame: SkImage;
  tile: NonNullable<PaintImageLayer['tile']>;
  maskNode: ReactNode;
}) {
  return (
    <Mask mode='alpha' mask={maskNode}>
      <Fill>
        <ImageShader image={frame} tx={tile.tx} ty={tile.ty} />
      </Fill>
    </Mask>
  );
}

function StretchPaintLayerOverlay({
  frame,
  rect,
  maskNode,
}: {
  frame: SkImage;
  rect: NonNullable<PaintImageLayer['rect']>;
  maskNode: ReactNode;
}) {
  return (
    <Mask mode='alpha' mask={maskNode}>
      <Image
        image={frame}
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
  frames: PaintFrames,
): ReactNode {
  const frame = frames.get(layer.url);

  if (!maskNode || !frame) {
    return null;
  }

  if (layer.tile) {
    return (
      <TiledPaintLayerOverlay
        frame={frame}
        tile={layer.tile}
        maskNode={maskNode}
      />
    );
  }

  if (layer.rect) {
    return (
      <StretchPaintLayerOverlay
        frame={frame}
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
  frames: PaintFrames,
): ReactNode {
  if (slot.kind === 'baked') {
    return (
      <Image
        // eslint-disable-next-line react-doctor/no-array-index-as-key -- static list that never reorders
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

  const overlay = renderUrlLayerOverlay(slot.layer, maskNode, frames);

  if (!overlay) {
    return null;
  }

  return (
    <UrlLayerSpan
      // eslint-disable-next-line react-doctor/no-array-index-as-key -- static list that never reorders
      key={`url-${index}|${paintImageLayerKey(slot.layer)}`}
      opacity={slot.layer.opacity}
    >
      {overlay}
    </UrlLayerSpan>
  );
}

/**
 * One URL layer. `layer` forces a real saveLayer so the fade applies to the
 * flattened texture, the same way a CSS background-image fades.
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

function paintLayerUrls(layers: readonly PaintImageLayer[]): string[] {
  const seen = new Set<string>();
  const urls: string[] = [];

  for (const layer of layers) {
    if (!layer.url || seen.has(layer.url)) {
      continue;
    }

    seen.add(layer.url);
    urls.push(layer.url);
  }

  return urls;
}

/**
 * Draws the foundation, then the layer slots back to front (URL overlays
 * between baked gradients), then the stroke on top, so CSS stacking and
 * -webkit-text-stroke hold. The compiler is off so a cached render cannot
 * keep the first texture frame.
 */
function ImageLayerPaintCanvas({ bitmaps }: { bitmaps: PaintBitmaps }) {
  'use no memo';

  const { width, height, insets, staticImage, layerSlots, strokeImage } =
    bitmaps;

  const maskNode = paintMaskNode(bitmaps);
  const canvasRef = useCanvasRedrawOnVisible();
  const urls = useMemo(
    () => paintLayerUrls(bitmaps.imageLayers),
    [bitmaps.imageLayers],
  );
  const frames = useSharedPaintFrames(urls);

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
        renderLayerSlot(slot, index, bitmaps, maskNode, frames),
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

function PaintCanvasFrame({
  children,
  lineHeight,
}: {
  children: ReactNode;
  lineHeight?: number;
}) {
  if (!lineHeight) {
    return children;
  }

  return (
    <View style={{ height: lineHeight, justifyContent: 'center' }}>
      {children}
    </View>
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
 * advance on the JS thread, stroke composites last.
 */
export function PaintedUsernameSkia({
  username,
  paint,
  fallbackColor = theme.color.text.dark,
  fontSize = chatLineMetrics.comfortable.fontSize,
  lineHeight,
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
      <ChatText
        style={{
          ...chatLineMetrics.comfortable,
          fontSize,
          lineHeight: lineHeight ?? chatLineMetrics.comfortable.lineHeight,
          fontWeight: 'bold',
          color: fallbackColor,
        }}
      >
        {username}
      </ChatText>
    );
  }

  const canvas =
    bitmaps.imageLayers.length > 0 ? (
      <ImageLayerPaintCanvas bitmaps={bitmaps} />
    ) : (
      <PaintBitmapCanvas bitmaps={bitmaps} />
    );

  return <PaintCanvasFrame lineHeight={lineHeight}>{canvas}</PaintCanvasFrame>;
}
