import type {
  SkCanvas,
  SkImage,
  SkImageFilter,
  SkPaint,
  SkShader,
  SkTypefaceFontProvider,
} from '@shopify/react-native-skia';
import {
  ClipOp,
  FontWeight,
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
  PaintTextStroke,
} from '@app/types/seventv/cosmetics';
import { sevenTvColorToCss } from '@app/utils/color/sevenTvColorToCss';

import {
  getPaintDropShadows,
  getPaintLayers,
  isTilingCanvasRepeat,
  type PaintLayerTileMode,
  paintLayerTileModes,
} from './paintLayer';
import { getPaintTextShadows, getPaintTextStroke } from './paintTextStyle';
import {
  cssDropShadowSigma,
  cssLinearGradientLine,
  farthestCornerCircleRadius,
  farthestCornerEllipseRadii,
  type LayerRect,
  layerRectInBox,
} from './skiaPaintGeometry';

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

// Wide enough that a username never wraps; shared by the measuring and
// drawing paragraphs so shaping is identical between passes.
const LAYOUT_WIDTH = 8192;

// A Gaussian's visible falloff is ~3 standard deviations.
const BLUR_EXTENT_SIGMAS = 3;

/**
 * CSS gradients interpolate their colour stops in premultiplied sRGBA
 * (css-images-3 §3.4.1); Skia's gradient factories take this as flag `1`, so
 * passing it matches the browser's stop blending, including alpha stops where
 * unpremultiplied interpolation would grey the midpoints.
 */
const GRADIENT_PREMUL_FLAG = 1;

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
 * `repeating-radial-gradient` do - no stop-expansion approximation.
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
      undefined,
      GRADIENT_PREMUL_FLAG,
    );
  }

  const center = {
    x: rect.x + rect.width / 2,
    y: rect.y + rect.height / 2,
  };
  const circleRadius = farthestCornerCircleRadius(rect.width, rect.height);

  /**
   * CSS ellipse gradients are circles stretched to the box's aspect ratio;
   * Skia only draws circular gradients, so stretch via a local matrix
   * around centre
   */
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
    /**
     * An equal-centre two-point conical gradient runs between two radii, so
     * rings tile inward and outward from the stop span like CSS's
     * repeating-radial-gradient
     */
    return Skia.Shader.MakeTwoPointConicalGradient(
      center,
      radius * firstAt,
      center,
      radius * lastAt,
      colors,
      positions,
      TileMode.Repeat,
      localMatrix,
      GRADIENT_PREMUL_FLAG,
    );
  }

  return Skia.Shader.MakeRadialGradient(
    center,
    radius,
    colors,
    positions,
    TileMode.Clamp,
    localMatrix,
    GRADIENT_PREMUL_FLAG,
  );
}

/**
 * Skia decodes WebP (still and animated) reliably but not AVIF, and
 * `pickBestImage` prefers AVIF for static image layers, so swap 7TV CDN AVIF
 * layer urls to their WebP sibling (same path, always served). Animated layers
 * already resolve to WebP, so this only rescues static ones.
 */
function skiaDecodableLayerUrl(url: string): string {
  return url.replace(
    /^(https:\/\/cdn\.7tv\.app\/paint\/[^?\s]+)\.avif(\?\S*)?$/,
    '$1.webp$2',
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
 * `drop-shadow()`s compound - each filter shadows the previous filter's
 * output, shadow included - so extents accumulate through the chain rather
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

/**
 * Measured, paint-derived geometry for one painted username, in device pixels.
 * Independent of the (possibly animating) image frames, so it is computed once
 * and reused for every drawn frame by the live renderer.
 */
interface PaintUsernameLayout {
  text: string;
  scale: number;
  fontSizePx: number;
  fontWeight: FontWeight;
  glyphWidthPx: number;
  glyphHeightPx: number;
  dropShadows: PaintShadow[];
  textShadows: PaintShadow[];
  stroke: PaintTextStroke | null;
  layers: PaintLayerData[];
  originX: number;
  originY: number;
  surfaceWidthPx: number;
  surfaceHeightPx: number;
  insetsPx: { left: number; top: number; right: number; bottom: number };
}

function paintUsernameText(paint: PaintData, displayUsername: string): string {
  const transform = paint.textStyle?.transform;
  if (transform === 'uppercase') {
    return displayUsername.toLocaleUpperCase();
  }
  if (transform === 'lowercase') {
    return displayUsername.toLocaleLowerCase();
  }
  return displayUsername;
}

function buildUsernameParagraph(
  opts: RasterizePaintedUsernameOptions,
  layout: Pick<PaintUsernameLayout, 'text' | 'fontSizePx' | 'fontWeight'>,
  fillPaint: SkPaint,
) {
  const skiaTextStyle = {
    fontFamilies: [opts.fontFamily],
    fontSize: layout.fontSizePx,
    fontStyle: { weight: layout.fontWeight },
  };
  const builder = Skia.ParagraphBuilder.Make(
    { maxLines: 1, textStyle: skiaTextStyle },
    opts.fontProvider,
  );
  builder.pushStyle(skiaTextStyle, fillPaint);
  builder.addText(layout.text);
  const paragraph = builder.build();
  paragraph.layout(LAYOUT_WIDTH);
  return paragraph;
}

/**
 * Measure the glyph box and shadow overflow for a paint. Frame-independent, so
 * the live renderer calls it once and reuses the result across every frame.
 */
function buildPaintLayout(
  opts: RasterizePaintedUsernameOptions,
): PaintUsernameLayout | null {
  const { paint, displayUsername, fontSize, pixelRatio } = opts;
  const scale = pixelRatio;

  /**
   * The extension renders paint weight as `weight * 100`; with no explicit
   * weight the painted span inherits chat's bold (700). Skia shapes glyphs
   * from the matching registered face, so a heavier paint reads heavier here.
   */
  const fontWeight: FontWeight = paint.textStyle?.weight
    ? ((paint.textStyle.weight * 100) as FontWeight)
    : FontWeight.Bold;
  const partial = {
    text: paintUsernameText(paint, displayUsername),
    fontSizePx: fontSize * scale,
    fontWeight,
  };

  const measured = buildUsernameParagraph(opts, partial, Skia.Paint());
  const glyphWidthPx = Math.ceil(measured.getLongestLine());
  const glyphHeightPx = Math.ceil(measured.getHeight());
  if (glyphWidthPx === 0 || glyphHeightPx === 0) {
    return null;
  }

  const dropShadows = getPaintDropShadows(paint, 2);
  const textShadows = getPaintTextShadows(paint);
  const stroke = getPaintTextStroke(paint);
  const extents = shadowExtents(dropShadows, textShadows, stroke?.width ?? 0);

  const insetsPx = {
    left: Math.ceil(extents.left * scale),
    top: Math.ceil(extents.top * scale),
    right: Math.ceil(extents.right * scale),
    bottom: Math.ceil(extents.bottom * scale),
  };

  return {
    ...partial,
    scale,
    glyphWidthPx,
    glyphHeightPx,
    dropShadows,
    textShadows,
    stroke,
    layers: getPaintLayers(paint),
    originX: insetsPx.left,
    originY: insetsPx.top,
    surfaceWidthPx: glyphWidthPx + insetsPx.left + insetsPx.right,
    surfaceHeightPx: glyphHeightPx + insetsPx.top + insetsPx.bottom,
    insetsPx,
  };
}

/**
 * Draw the static composite for a painted username onto `canvas`: text-shadows,
 * base fill, gradient layers, and stroke, wrapped in the drop-shadow chain.
 * Image (URL) layers are overlaid live over the cached bitmap, so they are
 * skipped here.
 */
function drawPaintedUsername(
  canvas: SkCanvas,
  opts: RasterizePaintedUsernameOptions,
  layout: PaintUsernameLayout,
): void {
  const { paint, fallbackColor } = opts;
  const { scale, glyphWidthPx, glyphHeightPx, originX, originY } = layout;
  const measurePaint = Skia.Paint();
  const drawGlyphs = (fillPaint: SkPaint) => {
    buildUsernameParagraph(opts, layout, fillPaint).paint(
      canvas,
      originX,
      originY,
    );
  };

  /**
   * CSS `filter: drop-shadow(a) drop-shadow(b)` applies b to a's output
   * (source + shadow), so the filters nest rather than stack; the whole
   * element render - text-shadows, stroke, and fill - is the chain's source.
   */
  let dropShadowChain: SkImageFilter | null = null;
  for (const shadow of layout.dropShadows) {
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

  /**
   * Each text-shadow is drawn independently beneath the glyphs, first-listed
   * on top (CSS paint order).
   */
  for (const shadow of [...layout.textShadows].reverse()) {
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

  const basePaint = Skia.Paint();
  basePaint.setColor(
    paint.color === null ? Skia.Color(fallbackColor) : skColor(paint.color),
  );
  drawGlyphs(basePaint);

  /**
   * `background-image` lists the topmost layer first, so draw back-to-front.
   * Gradient layers become gradient shaders clipped to the glyphs; image (URL)
   * layers are drawn live over the cached composite, so skip them here.
   */
  for (const layer of [...layout.layers].reverse()) {
    if (layer.function === 'URL') {
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

  /**
   * -webkit-text-stroke paints over the fill (WebKit's default paint order),
   * centred on the glyph outline, so a centred Skia stroke of the same width
   * drawn last reproduces it, and staying inside the drop-shadow layer keeps
   * the stroke part of the shadow silhouette.
   */
  if (layout.stroke) {
    const strokePaint = Skia.Paint();
    strokePaint.setStyle(PaintStyle.Stroke);
    strokePaint.setStrokeWidth(layout.stroke.width * scale);
    strokePaint.setColor(skColor(layout.stroke.color));
    drawGlyphs(strokePaint);
  }

  canvas.restore();
}

interface LogicalRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Cache-friendly render inputs for a painted username. `staticImage` bakes
 * everything except the (first) image layer - gradients, base fill, drop
 * shadows, all glyph-clipped - into one bitmap reused across mounts and every
 * user wearing the paint. Image-layer paints additionally return `maskImage`
 * (glyph coverage) plus the layer's url/rect so the live renderer can overlay
 * the animated texture through the mask; `useAnimatedImageValue` drives its
 * frames on the UI thread, so the static bitmap never re-rasterizes.
 *
 * All sizes are logical points. `staticImage`/`maskImage` are baked at device
 * pixels and drawn into the logical box, so they stay crisp on retina.
 */
export interface PaintBitmaps {
  staticImage: SkImage;
  maskImage: SkImage | null;
  animatedUrl: string | null;
  animatedRect: LogicalRect | null;
  animatedTile: { tx: PaintLayerTileMode; ty: PaintLayerTileMode } | null;
  width: number;
  height: number;
  insets: { left: number; top: number; right: number; bottom: number };
}

/**
 * Bounded LRU: caps the cache at ~256 paint bitmaps (paint x user x fontSize
 * x pixelRatio). 7TV serves a few hundred paints in total; 256 covers the
 * working set of a chat session without letting the map grow unbounded.
 */
const MAX_CACHED_PAINT_BITMAPS = 256;
const paintBitmapCache = new Map<string, PaintBitmaps>();

let nextPaintRevision = 1;
const paintRevisions = new WeakMap<PaintData, number>();

function paintRevision(paint: PaintData): number {
  let revision = paintRevisions.get(paint);
  if (revision === undefined) {
    revision = nextPaintRevision;
    nextPaintRevision += 1;
    paintRevisions.set(paint, revision);
  }
  return revision;
}

function paintBitmapCacheKey(opts: RasterizePaintedUsernameOptions): string {
  return `${opts.paint.id}|${paintRevision(opts.paint)}|${opts.displayUsername}|${opts.fontSize}|${opts.pixelRatio}`;
}

/**
 * Build (or return the cached) render inputs for a painted username. Pure and
 * synchronous - no image decode - because the static bitmap deliberately omits
 * the image layer, which the live renderer loads via `useAnimatedImageValue`.
 */
export function getPaintBitmaps(
  opts: RasterizePaintedUsernameOptions,
): PaintBitmaps | null {
  const key = paintBitmapCacheKey(opts);
  const cached = paintBitmapCache.get(key);
  if (cached) {
    /**
     * Map iteration order is insertion order, so re-inserting on hit keeps
     * eviction least-recently-used rather than first-inserted.
     */
    paintBitmapCache.delete(key);
    paintBitmapCache.set(key, cached);
    return cached;
  }

  const layout = buildPaintLayout(opts);
  if (!layout) {
    return null;
  }

  const staticSurface = Skia.Surface.Make(
    layout.surfaceWidthPx,
    layout.surfaceHeightPx,
  );
  if (!staticSurface) {
    return null;
  }
  drawPaintedUsername(staticSurface.getCanvas(), opts, layout);
  const staticImage = staticSurface.makeImageSnapshot();

  /**
   * The snapshot owns its pixels once made; dispose the surface immediately
   * rather than waiting for GC to reclaim it.
   */
  staticSurface.dispose();

  const { scale } = layout;
  const imageLayer = layout.layers.find(
    layer => layer.function === 'URL' && layer.image_url,
  );

  let maskImage: SkImage | null = null;
  let animatedUrl: string | null = null;
  let animatedRect: LogicalRect | null = null;
  let animatedTile: PaintBitmaps['animatedTile'] = null;

  if (imageLayer) {
    animatedUrl = skiaDecodableLayerUrl(imageLayer.image_url);
    if (isTilingCanvasRepeat(imageLayer.canvas_repeat, imageLayer.repeat)) {
      animatedTile = paintLayerTileModes(imageLayer.canvas_repeat);
    }
    const maskSurface = Skia.Surface.Make(
      layout.surfaceWidthPx,
      layout.surfaceHeightPx,
    );
    if (maskSurface) {
      const whitePaint = Skia.Paint();
      whitePaint.setColor(Skia.Color('white'));
      buildUsernameParagraph(opts, layout, whitePaint).paint(
        maskSurface.getCanvas(),
        layout.originX,
        layout.originY,
      );
      maskImage = maskSurface.makeImageSnapshot();
      maskSurface.dispose();
    }
    const rect = layerRectInBox(
      imageLayer.at,
      imageLayer.size,
      layout.glyphWidthPx,
      layout.glyphHeightPx,
    );
    animatedRect = {
      x: (layout.originX + rect.x) / scale,
      y: (layout.originY + rect.y) / scale,
      width: rect.width / scale,
      height: rect.height / scale,
    };
  }

  const bitmaps: PaintBitmaps = {
    staticImage,
    maskImage,
    animatedUrl,
    animatedRect,
    animatedTile,
    width: layout.surfaceWidthPx / scale,
    height: layout.surfaceHeightPx / scale,
    insets: {
      left: layout.insetsPx.left / scale,
      top: layout.insetsPx.top / scale,
      right: layout.insetsPx.right / scale,
      bottom: layout.insetsPx.bottom / scale,
    },
  };

  if (paintBitmapCache.size >= MAX_CACHED_PAINT_BITMAPS) {
    const oldest = paintBitmapCache.keys().next().value;
    if (oldest !== undefined) {
      paintBitmapCache.delete(oldest);
    }
  }
  paintBitmapCache.set(key, bitmaps);
  return bitmaps;
}
