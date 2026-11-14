import {
  BlendMode,
  FilterMode,
  type ISkiaViewApi,
  MipmapMode,
  type SkCanvas,
  Skia,
  type SkImage,
  type SkPaint,
  type SkPicture,
  type SkRect,
  TileMode,
} from '@shopify/react-native-skia';

import type { PaintLayerTileMode } from './paint-layer/paintLayerTileModes';
import type {
  PaintBitmaps,
  PaintImageLayer,
} from './skiaPaintedUsernameRasterizer';

const TILE_MODES = {
  clamp: TileMode.Clamp,
  decal: TileMode.Decal,
  mirror: TileMode.Mirror,
  repeat: TileMode.Repeat,
} satisfies Record<PaintLayerTileMode, TileMode>;

let drawPaint: SkPaint | null = null;
let maskPaint: SkPaint | null = null;
const fadePaints = new Map<number, SkPaint>();
const MAX_FADE_PAINTS = 16;

function getDrawPaint(): SkPaint {
  drawPaint ??= Skia.Paint();
  return drawPaint;
}

function getMaskPaint(): SkPaint {
  if (!maskPaint) {
    maskPaint = Skia.Paint();
    maskPaint.setBlendMode(BlendMode.DstIn);
  }

  return maskPaint;
}

function getFadePaint(opacity: number): SkPaint {
  const cached = fadePaints.get(opacity);

  if (cached) {
    return cached;
  }

  if (fadePaints.size >= MAX_FADE_PAINTS) {
    fadePaints.clear();
  }

  const paint = Skia.Paint();

  paint.setAlphaf(opacity);
  fadePaints.set(opacity, paint);
  return paint;
}

function drawImageFill(
  canvas: SkCanvas,
  image: SkImage,
  dst: SkRect,
  paint: SkPaint,
): void {
  canvas.drawImageRectOptions(
    image,
    Skia.XYWHRect(0, 0, image.width(), image.height()),
    dst,
    FilterMode.Linear,
    MipmapMode.None,
    paint,
  );
}

function drawUrlLayerFill(
  canvas: SkCanvas,
  layer: PaintImageLayer,
  frame: SkImage,
  paint: SkPaint,
): void {
  if (layer.tile) {
    const shader = frame.makeShaderOptions(
      TILE_MODES[layer.tile.tx],
      TILE_MODES[layer.tile.ty],
      FilterMode.Linear,
      MipmapMode.None,
    );

    paint.setShader(shader);
    canvas.drawPaint(paint);
    paint.setShader(null);
    shader.dispose();
    return;
  }

  if (layer.rect) {
    const { x, y, width, height } = layer.rect;

    drawImageFill(canvas, frame, Skia.XYWHRect(x, y, width, height), paint);
  }
}

interface DrawUrlLayerOptions {
  canvas: SkCanvas;
  layer: PaintImageLayer;
  frame: SkImage;
  mask: SkImage;
  bounds: SkRect;
}

function drawUrlLayer({
  canvas,
  layer,
  frame,
  mask,
  bounds,
}: DrawUrlLayerOptions): void {
  if (!layer.tile && !layer.rect) {
    return;
  }

  const paint = getDrawPaint();
  const faded = layer.opacity < 1;

  if (faded) {
    canvas.saveLayer(getFadePaint(layer.opacity));
  }

  canvas.saveLayer();
  drawUrlLayerFill(canvas, layer, frame, paint);
  canvas.saveLayer(getMaskPaint());
  drawImageFill(canvas, mask, bounds, paint);
  canvas.restore();
  canvas.restore();

  if (faded) {
    canvas.restore();
  }
}

export function recordPaintLayerPicture(
  bitmaps: PaintBitmaps,
  getFrame: (url: string) => SkImage | null,
): SkPicture {
  const { width, height, staticImage, layerSlots, maskImage, strokeImage } =
    bitmaps;

  const bounds = Skia.XYWHRect(0, 0, width, height);
  const recorder = Skia.PictureRecorder();
  const canvas = recorder.beginRecording(bounds);
  const paint = getDrawPaint();

  drawImageFill(canvas, staticImage, bounds, paint);

  for (const slot of layerSlots) {
    if (slot.kind === 'baked') {
      drawImageFill(canvas, slot.image, bounds, paint);
      continue;
    }

    const frame = getFrame(slot.layer.url);

    if (frame && maskImage) {
      drawUrlLayer({
        canvas,
        layer: slot.layer,
        frame,
        mask: maskImage,
        bounds,
      });
    }
  }

  if (strokeImage) {
    drawImageFill(canvas, strokeImage, bounds, paint);
  }

  const picture = recorder.finishRecordingAsPicture();

  recorder.dispose();
  return picture;
}

interface PaintPictureView {
  readonly nativeId: number;
}

export interface PaintLayerPictureTarget {
  current: { redraw: () => void };
  setBitmaps: (bitmaps: PaintBitmaps) => void;
}

export function createPaintLayerPictureTarget(
  view: { current: PaintPictureView | null },
  getFrame: (url: string) => SkImage | null,
): PaintLayerPictureTarget {
  let bitmaps: PaintBitmaps | null = null;

  const redraw = () => {
    const nativeId = view.current?.nativeId;
    // SAFETY: react-native-skia installs this global on native; jest and web do not.
    const viewApi = (globalThis as { SkiaViewApi?: ISkiaViewApi }).SkiaViewApi;

    if (!bitmaps || nativeId === undefined || !viewApi) {
      return;
    }

    const picture = recordPaintLayerPicture(bitmaps, getFrame);

    viewApi.setJsiProperty(nativeId, 'picture', picture);
    picture.dispose();
  };

  return {
    current: { redraw },
    setBitmaps: next => {
      bitmaps = next;
      redraw();
    },
  };
}
