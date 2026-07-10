import type {
  SkImageFilter,
  SkPaint,
  SkShader,
  SkTypefaceFontProvider,
} from '@shopify/react-native-skia';
import {
  ClipOp,
  ImageFormat,
  PaintStyle,
  Skia,
  TileMode,
} from '@shopify/react-native-skia';

import { indexedCollectionToArray } from '@app/services/ws/util/indexedCollection';
import type {
  PaintData,
  PaintLayerData,
  PaintShadow,
  PaintStop,
} from '@app/types/seventv/cosmetics';
import { sevenTvColorToCss } from '@app/utils/color/sevenTvColorToCss';

import { getPaintDropShadows, getPaintLayers } from '../util/paintLayer';
import {
  getPaintTextShadows,
  getPaintTextStroke,
} from '../util/paintTextStyle';
import {
  cssDropShadowSigma,
  cssLinearGradientLine,
  farthestCornerCircleRadius,
  farthestCornerEllipseRadii,
  type LayerRect,
  layerRectInBox,
} from './util/skiaPaintGeometry';

export interface RasterizePaintedUsernameOptions {
  displayUsername: string;
  paint: PaintData;
  fallbackColor: string;
  fontSize: number;
  /**
   * Device pixels per logical pixel; the bitmap is rendered at this scale and
   * displayed at logical size so glyph edges stay crisp.
   */
  pixelRatio: number;
  fontProvider: SkTypefaceFontProvider;
  fontFamily: string;
}

export interface RasterizedPaintedUsername {
  uri: string;
  /**
   * Full bitmap size in logical pixels, including the shadow overflow margin.
   */
  width: number;
  height: number;
  /**
   * Logical-pixel inset from the bitmap edge to the glyph box, so callers can
   * overlap the margin and keep the glyphs aligned with neighbouring text
   * (CSS lets drop shadows paint outside the layout box).
   */
  insets: { left: number; top: number; right: number; bottom: number };
  /**
   * True when the paint had image (URL) layers, which this POC does not
   * rasterize; the fill falls back to the layers beneath them.
   */
  skippedImageLayers: boolean;
}

// Wide enough that a username never wraps; shared by the measuring and
// drawing paragraphs so shaping is identical between passes.
const LAYOUT_WIDTH = 8192;

// A Gaussian's visible falloff is ~3 standard deviations.
const BLUR_EXTENT_SIGMAS = 3;

function sortedLayerStops(layer: PaintLayerData): PaintStop[] {
  return indexedCollectionToArray<PaintStop>(layer.stops)
    .slice()
    .sort((a, b) => a.at - b.at);
}

function skColor(color: number): Float32Array {
  return Skia.Color(sevenTvColorToCss(color));
}

/**
 * One gradient layer as a Skia shader over its layer rect. Repeating
 * gradients keep CSS's absolute stop phase: the shader spans the
 * [first, last] stop range with normalized positions and tiles from there
 * (`TileMode.Repeat`), which is exactly what `repeating-linear-gradient` /
 * `repeating-radial-gradient` do — no stop-expansion approximation.
 */
function layerShader(layer: PaintLayerData, rect: LayerRect): SkShader | null {
  const stops = sortedLayerStops(layer);
  if (stops.length < 2) {
    return null;
  }

  const colors = stops.map(stop => skColor(stop.color));
  const firstAt = stops[0]?.at ?? 0;
  const lastAt = stops[stops.length - 1]?.at ?? 1;
  const period = lastAt - firstAt;
  const repeats = layer.repeat && period > 0.0001;
  const positions = repeats
    ? stops.map(stop => (stop.at - firstAt) / period)
    : stops.map(stop => stop.at);
  const tileMode = repeats ? TileMode.Repeat : TileMode.Clamp;

  if (layer.function === 'LINEAR_GRADIENT') {
    const line = cssLinearGradientLine(
      layer.angle ?? 0,
      rect.width,
      rect.height,
    );
    const toCanvas = (point: { x: number; y: number }) => ({
      x: rect.x + point.x,
      y: rect.y + point.y,
    });
    const lineVector = {
      x: line.end.x - line.start.x,
      y: line.end.y - line.start.y,
    };
    const pointAt = (t: number) =>
      toCanvas({
        x: line.start.x + lineVector.x * t,
        y: line.start.y + lineVector.y * t,
      });
    const start = repeats ? pointAt(firstAt) : toCanvas(line.start);
    const end = repeats ? pointAt(lastAt) : toCanvas(line.end);

    return Skia.Shader.MakeLinearGradient(
      start,
      end,
      colors,
      positions,
      tileMode,
    );
  }

  const center = {
    x: rect.x + rect.width / 2,
    y: rect.y + rect.height / 2,
  };
  const circleRadius = farthestCornerCircleRadius(rect.width, rect.height);

  // CSS ellipse gradients are circles stretched to the box's aspect ratio;
  // Skia only draws circular gradients, so stretch via a local matrix
  // around the centre.
  let localMatrix;
  let radius = circleRadius;
  if (layer.shape === 'ellipse') {
    const { rx, ry } = farthestCornerEllipseRadii(rect.width, rect.height);
    radius = rx;
    localMatrix = Skia.Matrix();
    localMatrix.translate(center.x, center.y);
    localMatrix.scale(1, ry / rx);
    localMatrix.translate(-center.x, -center.y);
  }

  if (repeats) {
    // An equal-centre two-point conical gradient runs between two radii, so
    // rings tile inward and outward from the stop span like CSS's
    // repeating-radial-gradient.
    return Skia.Shader.MakeTwoPointConicalGradient(
      center,
      radius * firstAt,
      center,
      radius * lastAt,
      colors,
      positions,
      TileMode.Repeat,
      localMatrix,
    );
  }

  return Skia.Shader.MakeRadialGradient(
    center,
    radius,
    colors,
    positions,
    TileMode.Clamp,
    localMatrix,
  );
}

interface ShadowExtents {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

/**
 * How far outside the glyph box the shadows can paint (CSS px). Chained
 * `drop-shadow()`s compound — each filter shadows the previous filter's
 * output, shadow included — so extents accumulate through the chain rather
 * than taking a per-shadow max.
 */
function shadowExtents(
  dropShadows: PaintShadow[],
  textShadows: PaintShadow[],
  strokeWidth: number,
): ShadowExtents {
  const extents: ShadowExtents = {
    left: strokeWidth,
    top: strokeWidth,
    right: strokeWidth,
    bottom: strokeWidth,
  };

  for (const shadow of textShadows) {
    const blur = BLUR_EXTENT_SIGMAS * cssDropShadowSigma(shadow.radius);
    extents.left = Math.max(extents.left, blur - shadow.x_offset);
    extents.right = Math.max(extents.right, blur + shadow.x_offset);
    extents.top = Math.max(extents.top, blur - shadow.y_offset);
    extents.bottom = Math.max(extents.bottom, blur + shadow.y_offset);
  }

  for (const shadow of dropShadows) {
    const blur = BLUR_EXTENT_SIGMAS * cssDropShadowSigma(shadow.radius);
    extents.left = Math.max(
      extents.left,
      extents.left + blur - shadow.x_offset,
    );
    extents.right = Math.max(
      extents.right,
      extents.right + blur + shadow.x_offset,
    );
    extents.top = Math.max(extents.top, extents.top + blur - shadow.y_offset);
    extents.bottom = Math.max(
      extents.bottom,
      extents.bottom + blur + shadow.y_offset,
    );
  }

  return extents;
}

export function rasterizePaintedUsername({
  displayUsername,
  paint,
  fallbackColor,
  fontSize,
  pixelRatio,
  fontProvider,
  fontFamily,
}: RasterizePaintedUsernameOptions): RasterizedPaintedUsername | null {
  const transform = paint.textStyle?.transform;
  const text =
    transform === 'uppercase'
      ? displayUsername.toLocaleUpperCase()
      : transform === 'lowercase'
        ? displayUsername.toLocaleLowerCase()
        : displayUsername;

  const scale = pixelRatio;
  const fontSizePx = fontSize * scale;

  const buildParagraph = (fillPaint: SkPaint) => {
    const builder = Skia.ParagraphBuilder.Make(
      {
        maxLines: 1,
        textStyle: { fontFamilies: [fontFamily], fontSize: fontSizePx },
      },
      fontProvider,
    );
    builder.pushStyle(
      { fontFamilies: [fontFamily], fontSize: fontSizePx },
      fillPaint,
    );
    builder.addText(text);
    const paragraph = builder.build();
    paragraph.layout(LAYOUT_WIDTH);
    return paragraph;
  };

  const measurePaint = Skia.Paint();
  const measured = buildParagraph(measurePaint);
  const glyphWidthPx = Math.ceil(measured.getLongestLine());
  const glyphHeightPx = Math.ceil(measured.getHeight());
  if (glyphWidthPx === 0 || glyphHeightPx === 0) {
    return null;
  }

  const dropShadows = getPaintDropShadows(paint, 2);
  const textShadows = getPaintTextShadows(paint);
  const stroke = getPaintTextStroke(paint);
  const extents = shadowExtents(dropShadows, textShadows, stroke?.width ?? 0);

  const insetLeftPx = Math.ceil(extents.left * scale);
  const insetTopPx = Math.ceil(extents.top * scale);
  const insetRightPx = Math.ceil(extents.right * scale);
  const insetBottomPx = Math.ceil(extents.bottom * scale);
  const surfaceWidth = glyphWidthPx + insetLeftPx + insetRightPx;
  const surfaceHeight = glyphHeightPx + insetTopPx + insetBottomPx;

  const surface = Skia.Surface.Make(surfaceWidth, surfaceHeight);
  if (!surface) {
    return null;
  }

  const canvas = surface.getCanvas();
  const originX = insetLeftPx;
  const originY = insetTopPx;

  const drawGlyphs = (fillPaint: SkPaint) => {
    buildParagraph(fillPaint).paint(canvas, originX, originY);
  };

  // CSS `filter: drop-shadow(a) drop-shadow(b)` applies b to a's output
  // (source + shadow), so the filters nest rather than stack; the whole
  // element render — text-shadows, stroke, and fill — is the chain's source.
  let dropShadowChain: SkImageFilter | null = null;
  for (const shadow of dropShadows) {
    dropShadowChain = Skia.ImageFilter.MakeDropShadow(
      shadow.x_offset * scale,
      shadow.y_offset * scale,
      cssDropShadowSigma(shadow.radius) * scale,
      cssDropShadowSigma(shadow.radius) * scale,
      skColor(shadow.color),
      dropShadowChain,
    );
  }
  const chainPaint = Skia.Paint();
  if (dropShadowChain) {
    chainPaint.setImageFilter(dropShadowChain);
  }
  canvas.saveLayer(dropShadowChain ? chainPaint : undefined);

  // text-shadow list: each shadow is drawn independently beneath the glyphs,
  // first-listed on top.
  for (const shadow of [...textShadows].reverse()) {
    const shadowLayerPaint = Skia.Paint();
    shadowLayerPaint.setImageFilter(
      Skia.ImageFilter.MakeDropShadowOnly(
        shadow.x_offset * scale,
        shadow.y_offset * scale,
        cssDropShadowSigma(shadow.radius) * scale,
        cssDropShadowSigma(shadow.radius) * scale,
        skColor(shadow.color),
        null,
      ),
    );
    canvas.saveLayer(shadowLayerPaint);
    drawGlyphs(measurePaint);
    canvas.restore();
  }

  // -webkit-text-stroke centres the stroke on the glyph outline; the fill
  // drawn on top covers the inner half, leaving width/2 visible outside,
  // which a centred Skia stroke of the same width reproduces.
  if (stroke) {
    const strokePaint = Skia.Paint();
    strokePaint.setStyle(PaintStyle.Stroke);
    strokePaint.setStrokeWidth(stroke.width * scale);
    strokePaint.setColor(skColor(stroke.color));
    drawGlyphs(strokePaint);
  }

  // background-color: currentcolor sits beneath the background-image stack.
  const basePaint = Skia.Paint();
  basePaint.setColor(
    paint.color === null ? Skia.Color(fallbackColor) : skColor(paint.color),
  );
  drawGlyphs(basePaint);

  // background-image lists the topmost layer first, so draw back-to-front.
  const layers = getPaintLayers(paint);
  let skippedImageLayers = false;
  for (const layer of [...layers].reverse()) {
    if (layer.function === 'URL') {
      skippedImageLayers = true;
      continue;
    }
    const rect = layerRectInBox(
      layer.at,
      layer.size,
      glyphWidthPx,
      glyphHeightPx,
    );
    const canvasRect = {
      x: originX + rect.x,
      y: originY + rect.y,
      width: rect.width,
      height: rect.height,
    };
    const shader = layerShader(layer, canvasRect);
    if (!shader) {
      continue;
    }
    const fillPaint = Skia.Paint();
    fillPaint.setShader(shader);
    canvas.save();
    canvas.clipRect(
      Skia.XYWHRect(
        canvasRect.x,
        canvasRect.y,
        canvasRect.width,
        canvasRect.height,
      ),
      ClipOp.Intersect,
      true,
    );
    drawGlyphs(fillPaint);
    canvas.restore();
  }

  canvas.restore();

  const image = surface.makeImageSnapshot();
  const uri = `data:image/png;base64,${image.encodeToBase64(ImageFormat.PNG, 100)}`;

  return {
    uri,
    width: surfaceWidth / scale,
    height: surfaceHeight / scale,
    insets: {
      left: insetLeftPx / scale,
      top: insetTopPx / scale,
      right: insetRightPx / scale,
      bottom: insetBottomPx / scale,
    },
    skippedImageLayers,
  };
}
