import { AppState, Platform } from 'react-native';

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
  cachePaintBitmaps,
  clearPaintBitmapCache,
  getCachedPaintBitmaps,
} from './paintBitmapCacheLifecycle';
import { cssClampedStops } from './paintLayer/cssClampedStops';
import { getPaintDropShadows } from './paintLayer/getPaintDropShadows';
import { getPaintLayers } from './paintLayer/getPaintLayers';
import { isRenderablePaintLayer } from './paintLayer/isRenderablePaintLayer';
import { isTilingCanvasRepeat } from './paintLayer/isTilingCanvasRepeat';
import {
  type PaintLayerTileMode,
  paintLayerTileModes,
} from './paintLayer/paintLayerTileModes';
import { getPaintTextShadows } from './paintTextStyle/getPaintTextShadows';
import { getPaintTextStroke } from './paintTextStyle/getPaintTextStroke';
import { cssDropShadowSigma } from './skiaPaintGeometry/cssDropShadowSigma';
import { cssLinearGradientLine } from './skiaPaintGeometry/cssLinearGradientLine';
import { cssTextShadowSigma } from './skiaPaintGeometry/cssTextShadowSigma';
import { farthestCornerCircleRadius } from './skiaPaintGeometry/farthestCornerCircleRadius';
import { farthestCornerEllipseRadii } from './skiaPaintGeometry/farthestCornerEllipseRadii';
import {
  type LayerRect,
  layerRectInBox,
} from './skiaPaintGeometry/layerRectInBox';
import { paintShadowExtents } from './skiaPaintGeometry/paintShadowExtents';

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

/**
 * CSS gradients interpolate their colour stops in premultiplied sRGBA
 * (css-images-3 §3.4.1); Skia's gradient factories take this as flag `1`, so
 * passing it matches the browser's stop blending, including alpha stops where
 * unpremultiplied interpolation would grey the midpoints.
 */
const GRADIENT_PREMUL_FLAG = 1;

/**
 * A gradient layer renders as a span when it has at least one stop and is not
 * fully transparent. A single-stop layer is an invalid CSS gradient whose
 * span keeps only its base-colour backing.
 */
function isDrawableGradientLayer(layer: PaintLayerData): boolean {
  return layer.function !== 'URL' && isRenderablePaintLayer(layer);
}

/**
 * A URL layer composites live only when it produces a span; a dead URL layer
 * must not push the paint onto the live-composite path or split a gradient
 * batch.
 */
function isLiveUrlLayer(layer: PaintLayerData): boolean {
  return layer.function === 'URL' && isRenderablePaintLayer(layer);
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
  const stops = cssClampedStops(
    indexedCollectionToArray<PaintStop>(layer.stops),
  );
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

/**
 * SkParagraph excludes trailing breakable spaces from getLongestLine(), which
 * would glue the painted name to the message text; NBSP keeps the trailing
 * gap a plain <Text> username renders.
 */
function keepTrailingSpaces(text: string): string {
  return text.replace(/ +$/, match => '\u00A0'.repeat(match.length));
}

function paintUsernameText(paint: PaintData, displayUsername: string): string {
  const transform = paint.textStyle?.transform;
  if (transform === 'uppercase') {
    return keepTrailingSpaces(displayUsername.toLocaleUpperCase());
  }
  if (transform === 'lowercase') {
    return keepTrailingSpaces(displayUsername.toLocaleLowerCase());
  }
  return keepTrailingSpaces(displayUsername);
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
   * weight the painted span inherits the chat username as rendered. ui/Text
   * resolves usernames to the single-face Montserrat_400Regular family, so
   * iOS draws the 400 face (style fontWeight '700' finds no bold sibling in
   * that family) while Android synthesizes a faux bold from the same face.
   */
  const fontWeight: FontWeight = paint.textStyle?.weight
    ? ((paint.textStyle.weight * 100) as FontWeight)
    : Platform.OS === 'android'
      ? FontWeight.Bold
      : FontWeight.Normal;
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
  const extents = paintShadowExtents(
    dropShadows,
    textShadows,
    stroke?.width ?? 0,
  );

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
 * Image (URL) layers are omitted — they composite live so animated textures
 * can advance without re-baking.
 */
function drawPaintedUsername(
  canvas: SkCanvas,
  opts: RasterizePaintedUsernameOptions,
  layout: PaintUsernameLayout,
  options: {
    includeDropShadows: boolean;
    includeTextShadows: boolean;
    includeBaseFill: boolean;
    /**
     * Gradient layers to draw (already in back-to-front order), or null to
     * draw every non-URL layer from the layout back-to-front.
     */
    gradientLayers: PaintLayerData[] | null;
    includeStroke: boolean;
  } = {
    includeDropShadows: true,
    includeTextShadows: true,
    includeBaseFill: true,
    gradientLayers: null,
    includeStroke: true,
  },
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
  if (options.includeDropShadows) {
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
  if (options.includeTextShadows) {
    for (const shadow of [...layout.textShadows].reverse()) {
      const shadowLayerPaint = Skia.Paint();
      shadowLayerPaint.setImageFilter(
        Skia.ImageFilter.MakeDropShadowOnly(
          shadow.x_offset * scale,
          shadow.y_offset * scale,
          cssTextShadowSigma(shadow.radius) * scale,
          cssTextShadowSigma(shadow.radius) * scale,
          skColor(shadow.color),
          null,
        ),
      );
      canvas.saveLayer(shadowLayerPaint);
      drawGlyphs(measurePaint);
      canvas.restore();
    }
  }

  const basePaint = Skia.Paint();
  basePaint.setColor(
    paint.color === null ? Skia.Color(fallbackColor) : skColor(paint.color),
  );

  /**
   * `PaintData.layers` lists the topmost layer first, so draw back-to-front.
   * Image (URL) layers composite live; only gradient shaders are baked here.
   */
  const gradientsToDraw = (
    options.gradientLayers ?? [...layout.layers].reverse()
  ).filter(isDrawableGradientLayer);

  /**
   * With no layer spans the reference renders the plain username, which the
   * base fill reproduces; the live-composite foundation also passes an empty
   * layer list to get the fill that backs its URL textures.
   */
  if (options.includeBaseFill && gradientsToDraw.length === 0) {
    drawGlyphs(basePaint);
  }

  for (const layer of gradientsToDraw) {
    const grouped = layer.opacity < 1;
    if (grouped) {
      const groupPaint = Skia.Paint();
      groupPaint.setAlphaf(layer.opacity);
      canvas.saveLayer(groupPaint);
    }
    /**
     * Each reference layer span paints `background-color: currentColor`
     * beneath its own background and the whole span then fades by the layer
     * opacity, so an upper layer covers lower ones with the base colour
     * rather than blending into them.
     */
    drawGlyphs(basePaint);
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
    if (shader) {
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
    if (grouped) {
      canvas.restore();
    }
  }

  /**
   * -webkit-text-stroke paints over the fill (WebKit's default paint order),
   * centred on the glyph outline, so a centred Skia stroke of the same width
   * drawn last reproduces it, and staying inside the drop-shadow layer keeps
   * the stroke part of the shadow silhouette.
   */
  if (options.includeStroke && layout.stroke) {
    const strokePaint = Skia.Paint();
    strokePaint.setStyle(PaintStyle.Stroke);
    strokePaint.setStrokeWidth(layout.stroke.width * scale);
    strokePaint.setColor(skColor(layout.stroke.color));
    drawGlyphs(strokePaint);
  }

  canvas.restore();
}

function snapshotPaintSurface(
  layout: PaintUsernameLayout,
  draw: (canvas: SkCanvas) => void,
): SkImage | null {
  const surface = Skia.Surface.Make(
    layout.surfaceWidthPx,
    layout.surfaceHeightPx,
  );
  if (!surface) {
    return null;
  }
  draw(surface.getCanvas());
  const image = surface.makeImageSnapshot();
  surface.dispose();
  return image;
}

interface LogicalRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface PaintImageLayer {
  url: string;
  rect: LogicalRect | null;
  tile: { tx: PaintLayerTileMode; ty: PaintLayerTileMode } | null;
  /**
   * v4 layer-span opacity; the live compositor fades the span (backing +
   * texture) by this.
   */
  opacity: number;
}

/**
 * One step of the live composite after the foundation bitmap. Gradients that
 * sit above a URL layer must bake into their own slot so they paint after the
 * live texture; stroke is a separate top slot so URL overlays cannot hide it.
 */
export type PaintLayerSlot =
  { kind: 'url'; layer: PaintImageLayer } | { kind: 'baked'; image: SkImage };

/**
 * The bottom-most opaque URL span already sits on the foundation's base
 * fill; only spans above other slots, or faded ones, need the shared
 * base-colour backing. Shared by the bitmap builder and the live compositor
 * so they cannot disagree about when a backing exists.
 */
export function urlSlotNeedsBacking(
  index: number,
  layer: PaintImageLayer,
): boolean {
  return index > 0 || layer.opacity < 1;
}

/**
 * Cache-friendly render inputs for a painted username. `staticImage` is the
 * foundation (drop shadows, text-shadows, base fill). When the paint has URL
 * layers, `layerSlots` holds back-to-front URL overlays and baked gradient
 * runs so CSS stacking order is preserved, and `strokeImage` paints the
 * -webkit-text-stroke above every layer. Without URL layers, gradients and
 * stroke stay inside `staticImage` and the slot/stroke fields are empty.
 *
 * All sizes are logical points. Bitmaps are baked at device pixels and drawn
 * into the logical box, so they stay crisp on retina.
 */
export interface PaintBitmaps {
  staticImage: SkImage;
  maskImage: SkImage | null;
  /**
   * Base-colour glyphs drawn beneath each URL texture, mirroring the
   * reference's per-span `background-color: currentColor` backing. Null when
   * the foundation's own fill already provides it (single opaque URL layer).
   */
  backingImage: SkImage | null;
  layerSlots: PaintLayerSlot[];
  strokeImage: SkImage | null;
  /**
   * URL layers in back-to-front order (same as `layerSlots` url entries).
   * Kept for callers that only need the live texture list.
   */
  imageLayers: PaintImageLayer[];
  width: number;
  height: number;
  insets: { left: number; top: number; right: number; bottom: number };
}

function toPaintImageLayer(
  layer: PaintLayerData,
  layout: Pick<
    PaintUsernameLayout,
    'glyphWidthPx' | 'glyphHeightPx' | 'originX' | 'originY' | 'scale'
  >,
): PaintImageLayer | null {
  if (!isLiveUrlLayer(layer)) {
    return null;
  }
  const { opacity } = layer;
  const url = skiaDecodableLayerUrl(layer.image_url);

  if (isTilingCanvasRepeat(layer.canvas_repeat, layer.repeat)) {
    return {
      url,
      rect: null,
      tile: paintLayerTileModes(layer.canvas_repeat),
      opacity,
    };
  }

  const rect = layerRectInBox(
    layer.at,
    layer.size,
    layout.glyphWidthPx,
    layout.glyphHeightPx,
  );
  return {
    url,
    rect: {
      x: (layout.originX + rect.x) / layout.scale,
      y: (layout.originY + rect.y) / layout.scale,
      width: rect.width / layout.scale,
      height: rect.height / layout.scale,
    },
    tile: null,
    opacity,
  };
}

export function buildPaintImageLayers(
  layout: Pick<
    PaintUsernameLayout,
    | 'layers'
    | 'glyphWidthPx'
    | 'glyphHeightPx'
    | 'originX'
    | 'originY'
    | 'scale'
  >,
): PaintImageLayer[] {
  const imageLayers: PaintImageLayer[] = [];

  for (const layer of [...layout.layers].reverse()) {
    const imageLayer = toPaintImageLayer(layer, layout);
    if (imageLayer) {
      imageLayers.push(imageLayer);
    }
  }

  return imageLayers;
}

/**
 * Walk paint layers back-to-front. Contiguous gradient runs bake into one
 * slot; each URL becomes a live overlay slot so a gradient listed above a URL
 * still composites on top of that texture.
 */
export function planPaintLayerSlotKinds(
  layers: PaintLayerData[],
): ('url' | 'baked')[] {
  const kinds: ('url' | 'baked')[] = [];
  let pendingGradients = false;

  const flushGradients = () => {
    if (!pendingGradients) {
      return;
    }
    pendingGradients = false;
    kinds.push('baked');
  };

  for (const layer of [...layers].reverse()) {
    if (isLiveUrlLayer(layer)) {
      flushGradients();
      kinds.push('url');
      continue;
    }
    if (isDrawableGradientLayer(layer)) {
      pendingGradients = true;
    }
  }
  flushGradients();

  return kinds;
}

function buildPaintLayerSlots(
  opts: RasterizePaintedUsernameOptions,
  layout: PaintUsernameLayout,
): { layerSlots: PaintLayerSlot[]; imageLayers: PaintImageLayer[] } {
  const layerSlots: PaintLayerSlot[] = [];
  const imageLayers: PaintImageLayer[] = [];
  let gradientBatch: PaintLayerData[] = [];

  const flushGradients = () => {
    if (gradientBatch.length === 0) {
      return;
    }
    const batch = gradientBatch;
    gradientBatch = [];
    const baked = snapshotPaintSurface(layout, canvas => {
      drawPaintedUsername(canvas, opts, layout, {
        includeDropShadows: false,
        includeTextShadows: false,
        includeBaseFill: false,
        gradientLayers: batch,
        includeStroke: false,
      });
    });
    if (baked) {
      layerSlots.push({ kind: 'baked', image: baked });
    }
  };

  for (const layer of [...layout.layers].reverse()) {
    const imageLayer = toPaintImageLayer(layer, layout);
    if (imageLayer) {
      flushGradients();
      imageLayers.push(imageLayer);
      layerSlots.push({ kind: 'url', layer: imageLayer });
      continue;
    }
    if (isDrawableGradientLayer(layer)) {
      gradientBatch.push(layer);
    }
  }
  flushGradients();

  return { layerSlots, imageLayers };
}

export { clearPaintBitmapCache };

let memoryWarningSubscribed = false;

function subscribeToMemoryWarnings(): void {
  if (memoryWarningSubscribed) {
    return;
  }
  memoryWarningSubscribed = true;
  AppState.addEventListener('memoryWarning', () => {
    clearPaintBitmapCache();
  });
}

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
  const fallbackPart =
    opts.paint.color === null ? `|${opts.fallbackColor}` : '';
  return `${opts.paint.id}|${paintRevision(opts.paint)}|${opts.displayUsername}|${opts.fontSize}|${opts.pixelRatio}${fallbackPart}`;
}

/**
 * Build (or return the cached) render inputs for a painted username. Pure and
 * synchronous - no image decode - because URL layers load live via
 * `useAnimatedImageValue`. When URLs are present, gradients that stack above
 * them bake into separate slots and stroke is a top bitmap so CSS order holds.
 */
export function getPaintBitmaps(
  opts: RasterizePaintedUsernameOptions,
): PaintBitmaps | null {
  subscribeToMemoryWarnings();
  const key = paintBitmapCacheKey(opts);
  const cached = getCachedPaintBitmaps(key) as PaintBitmaps | undefined;
  if (cached) {
    return cached;
  }

  const layout = buildPaintLayout(opts);
  if (!layout) {
    return null;
  }

  const hasUrlLayers = layout.layers.some(isLiveUrlLayer);

  let staticImage: SkImage | null;
  let layerSlots: PaintLayerSlot[] = [];
  let imageLayers: PaintImageLayer[] = [];
  let strokeImage: SkImage | null = null;
  let backingImage: SkImage | null = null;

  if (hasUrlLayers) {
    staticImage = snapshotPaintSurface(layout, canvas => {
      drawPaintedUsername(canvas, opts, layout, {
        includeDropShadows: true,
        includeTextShadows: true,
        includeBaseFill: true,
        gradientLayers: [],
        includeStroke: false,
      });
    });
    if (!staticImage) {
      return null;
    }

    ({ layerSlots, imageLayers } = buildPaintLayerSlots(opts, layout));

    const needsUrlBacking = layerSlots.some(
      (slot, index) =>
        slot.kind === 'url' && urlSlotNeedsBacking(index, slot.layer),
    );
    if (needsUrlBacking) {
      backingImage = snapshotPaintSurface(layout, canvas => {
        drawPaintedUsername(canvas, opts, layout, {
          includeDropShadows: false,
          includeTextShadows: false,
          includeBaseFill: true,
          gradientLayers: [],
          includeStroke: false,
        });
      });
    }

    if (layout.stroke) {
      strokeImage = snapshotPaintSurface(layout, canvas => {
        drawPaintedUsername(canvas, opts, layout, {
          includeDropShadows: false,
          includeTextShadows: false,
          includeBaseFill: false,
          gradientLayers: [],
          includeStroke: true,
        });
      });
    }
  } else {
    staticImage = snapshotPaintSurface(layout, canvas => {
      drawPaintedUsername(canvas, opts, layout);
    });
    if (!staticImage) {
      return null;
    }
  }

  const { scale } = layout;

  let maskImage: SkImage | null = null;

  if (imageLayers.length > 0) {
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
  }

  const bitmaps: PaintBitmaps = {
    staticImage,
    maskImage,
    backingImage,
    layerSlots,
    strokeImage,
    imageLayers,
    width: layout.surfaceWidthPx / scale,
    height: layout.surfaceHeightPx / scale,
    insets: {
      left: layout.insetsPx.left / scale,
      top: layout.insetsPx.top / scale,
      right: layout.insetsPx.right / scale,
      bottom: layout.insetsPx.bottom / scale,
    },
  };

  cachePaintBitmaps(key, bitmaps);
  return bitmaps;
}
