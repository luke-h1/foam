import {
  type ReactNode,
  type RefObject,
  use,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { PixelRatio, View } from 'react-native';

import {
  Canvas,
  Image,
  SkiaPictureView,
  useCanvasRef,
} from '@shopify/react-native-skia';

import { chatLineMetrics } from '@app/components/chat/components/chat-message/util/chatScale';
import { theme } from '@app/styles/themes';
import type { PaintData } from '@app/types/seven-tv/cosmetics';
import {
  releasePaintBitmaps,
  retainPaintBitmaps,
} from '@app/utils/image/paintBitmapCacheLifecycle';

import { ChatRowText } from '../ChatRowText';
import { getChatRowTextStyleForProp } from '../util/chatRowTextStyle';
import { RowVisibilityContext } from '../util/rowVisibility';
import {
  getPaintTextureUrl,
  paintDependsOnTexture,
} from './util/paint-layer/paintDependsOnTexture';
import { skiaDecodableLayerUrl } from './util/paint-layer/skiaDecodableLayerUrl';
import { PAINT_FONT_FAMILY } from './util/paint-text-style/paintFont';
import {
  cancelPaintCanvasRedraw,
  type PaintCanvasRedrawTarget,
  schedulePaintCanvasRedraw,
} from './util/paintCanvasRedraw';
import { createPaintLayerPictureTarget } from './util/paintLayerPicture';
import { useSharedPaintAnimationReady } from './util/sharedPaintAnimationFrames';
import { subscribeSharedPaintFrames } from './util/sharedPaintAnimationStore';
import {
  getPaintBitmaps,
  type PaintBitmaps,
  type PaintImageLayer,
} from './util/skiaPaintedUsernameRasterizer';
import { useSkiaPaintFontProvider } from './util/skiaPaintFonts';

interface PaintedUsernameSkiaProps {
  username: string;
  paint: PaintData;
  fallbackColor?: string;
  fontSize?: number;
  /**
   * Chat line box. The bitmap is the glyph height, so the frame centers it
   * on the same line as the message text.
   */
  lineHeight?: number;
  strikethrough?: boolean;
  opacity?: number;
}

function useCanvasRedrawOnVisible(
  canvasRef: PaintCanvasRedrawTarget,
  bitmaps: PaintBitmaps,
) {
  const rowVisibility = use(RowVisibilityContext);

  useEffect(() => {
    schedulePaintCanvasRedraw(canvasRef);
    return () => cancelPaintCanvasRedraw(canvasRef);
  }, [canvasRef, bitmaps]);

  useEffect(() => {
    const unsubscribe = rowVisibility?.subscribe(() => {
      if (rowVisibility.isVisible()) {
        canvasRef.current?.redraw();
      }
    });

    return () => unsubscribe?.();
  }, [canvasRef, rowVisibility]);
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

function usePaintLayerPicture(
  viewRef: RefObject<SkiaPictureView | null>,
  bitmaps: PaintBitmaps,
) {
  const [target] = useState(() => createPaintLayerPictureTarget(viewRef));

  const urlKey = paintLayerUrls(bitmaps.imageLayers).join('\n');

  useLayoutEffect(() => {
    target.setBitmaps(bitmaps);
  }, [target, bitmaps]);

  useEffect(() => {
    const urls = urlKey === '' ? [] : urlKey.split('\n');

    const unsubscribe = subscribeSharedPaintFrames(urls, () =>
      schedulePaintCanvasRedraw(target),
    );

    return () => {
      cancelPaintCanvasRedraw(target);
      unsubscribe();
    };
  }, [target, urlKey]);
}

const PICTURE_VIEW_COLOR_PROPS = { colorSpace: 'p3' };

function ImageLayerPaintCanvas({
  bitmaps,
  opacity,
}: {
  bitmaps: PaintBitmaps;
  opacity?: number;
}) {
  const { width, height, insets } = bitmaps;
  const viewRef = useRef<SkiaPictureView>(null);

  useCanvasRedrawOnVisible(viewRef, bitmaps);
  usePaintLayerPicture(viewRef, bitmaps);

  return (
    <SkiaPictureView
      ref={viewRef}
      {...PICTURE_VIEW_COLOR_PROPS}
      style={{
        width,
        height,
        marginLeft: -insets.left,
        marginTop: -insets.top,
        marginRight: -insets.right,
        marginBottom: -insets.bottom,
        opacity,
      }}
    />
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

function PaintBitmapCanvas({
  bitmaps,
  opacity,
}: {
  bitmaps: PaintBitmaps;
  opacity?: number;
}) {
  const { width, height, insets, staticImage } = bitmaps;
  const canvasRef = useCanvasRef();

  useCanvasRedrawOnVisible(canvasRef, bitmaps);

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
        opacity,
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

export function PaintedUsernameSkia({
  username,
  paint,
  fallbackColor = theme.color.text.dark,
  fontSize = chatLineMetrics.comfortable.fontSize,
  lineHeight,
  strikethrough = false,
  opacity,
}: PaintedUsernameSkiaProps) {
  const fontProvider = useSkiaPaintFontProvider();
  const pixelRatio = PixelRatio.get();
  const [rebuildToken, setRebuildToken] = useState(0);
  const rawTextureUrl = getPaintTextureUrl(paint);

  const textureUrl = rawTextureUrl
    ? skiaDecodableLayerUrl(rawTextureUrl)
    : null;

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
          fontFamily: PAINT_FONT_FAMILY,
          strikethrough,
        })
      : null;
  }, [
    fontProvider,
    username,
    paint,
    fallbackColor,
    fontSize,
    pixelRatio,
    strikethrough,
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
      <ChatRowText
        style={getChatRowTextStyleForProp('muted', {
          ...chatLineMetrics.comfortable,
          fontSize,
          lineHeight: lineHeight ?? chatLineMetrics.comfortable.lineHeight,
          fontWeight: 'bold',
          color: fallbackColor,
          opacity,
          textDecorationLine: strikethrough ? 'line-through' : 'none',
        })}
      >
        {username}
      </ChatRowText>
    );
  }

  const canvas =
    bitmaps.imageLayers.length > 0 ? (
      <ImageLayerPaintCanvas bitmaps={bitmaps} opacity={opacity} />
    ) : (
      <PaintBitmapCanvas bitmaps={bitmaps} opacity={opacity} />
    );

  return <PaintCanvasFrame lineHeight={lineHeight}>{canvas}</PaintCanvasFrame>;
}
