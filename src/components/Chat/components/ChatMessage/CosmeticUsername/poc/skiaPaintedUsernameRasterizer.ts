import type {
  SkAnimatedImage,
  SkCanvas,
  SkImage,
  SkImageFilter,
  SkPaint,
  SkShader,
  SkTypefaceFontProvider,
} from '@shopify/react-native-skia';
import {
  ClipOp,
  FilterMode,
  FontWeight,
  ImageFormat,
  MipmapMode,
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
      undefined,
      GRADIENT_PREMUL_FLAG,
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
 * Image (URL) layer as a Skia shader: the decoded bitmap scaled to fill its
 * layer rect (these paints use `background-size: 100% 100%`) and clamped, so
 * it shows through the glyphs like the extension's `url(...)` background under
 * `background-clip: text`.
 */
function imageLayerShader(image: SkImage, rect: LayerRect): SkShader {
  const matrix = Skia.Matrix();
  matrix.translate(rect.x, rect.y);
  matrix.scale(rect.width / image.width(), rect.height / image.height());
  return image.makeShaderOptions(
    TileMode.Clamp,
    TileMode.Clamp,
    FilterMode.Linear,
    MipmapMode.None,
    matrix,
  );
}

/**
 * Decoded image (URL) layers for a paint, keyed by layer url:
 * - `frames` holds the current-frame `SkImage` for every decodable layer (the
 *   only frame for stills), which is what the draw pass samples.
 * - `animated` holds the `SkAnimatedImage` decoder for multi-frame textures;
 *   the live renderer advances these and refreshes `frames` each tick.
 *
 * Paint textures ship as animated WebP, which the still decoder rejects, so we
 * decode through the animated decoder and treat frameCount <= 1 as a still.
 */
export interface DecodedPaintImages {
  frames: Map<string, SkImage>;
  animated: Map<string, SkAnimatedImage>;
}

/**
 * Skia decodes WebP (still and animated) reliably but not AVIF, and
 * `pickBestImage` prefers AVIF for static image layers, so swap 7TV CDN AVIF
 * layer urls to their WebP sibling (same path, always served) before decoding.
 * Animated layers already resolve to WebP, so this only rescues static ones.
 */
function skiaDecodableLayerUrl(url: string): string {
  return url.replace(
    /^(https:\/\/cdn\.7tv\.app\/paint\/[^?\s]+)\.avif(\?\S*)?$/,
    '$1.webp$2',
  );
}

export async function decodePaintLayerImages(
  paint: PaintData,
): Promise<DecodedPaintImages> {
  const frames = new Map<string, SkImage>();
  const animated = new Map<string, SkAnimatedImage>();
  const tasks: Promise<void>[] = [];

  for (const layer of getPaintLayers(paint)) {
    if (layer.function !== 'URL' || !layer.image_url) {
      continue;
    }
    // Draw looks layers up by their original url; decode from a Skia-friendly one.
    const url = layer.image_url;
    tasks.push(
      (async () => {
        try {
          const data = await Skia.Data.fromURI(skiaDecodableLayerUrl(url));
          const anim = Skia.AnimatedImage.MakeAnimatedImageFromEncoded(data);
          if (anim && anim.getFrameCount() > 1) {
            animated.set(url, anim);
            const frame = anim.getCurrentFrame();
            if (frame) {
              frames.set(url, frame);
            }
            return;
          }
          const still =
            Skia.Image.MakeImageFromEncoded(data) ??
            anim?.getCurrentFrame() ??
            null;
          if (still) {
            frames.set(url, still);
          }
        } catch {
          // Undecodable layer: left out of the maps, drawn as skipped.
        }
      })(),
    );
  }

  await Promise.all(tasks);
  return { frames, animated };
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

/**
 * Measured, paint-derived geometry for one painted username, in device pixels.
 * Independent of the (possibly animating) image frames, so it is computed once
 * and reused for every drawn frame by the live renderer.
 */
export interface PaintUsernameLayout {
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
export function buildPaintLayout(
  opts: RasterizePaintedUsernameOptions,
): PaintUsernameLayout | null {
  const { paint, displayUsername, fontSize, pixelRatio } = opts;
  const scale = pixelRatio;
  // The extension renders paint weight as `weight * 100`; with no explicit
  // weight the painted span inherits chat's bold (700). Skia shapes glyphs
  // from the matching registered face, so a heavier paint reads heavier here.
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
 * Draw one painted username onto `canvas` using `frames` for image (URL)
 * layers. Shared by the offscreen raster and the live canvas so a static and
 * an animated render are pixel-identical apart from which image frame is
 * sampled. Returns whether any image layer was undecodable and skipped.
 */
export function drawPaintedUsername(
  canvas: SkCanvas,
  opts: RasterizePaintedUsernameOptions,
  layout: PaintUsernameLayout,
  frames: Map<string, SkImage>,
): { skippedImageLayers: boolean } {
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

  // CSS `filter: drop-shadow(a) drop-shadow(b)` applies b to a's output
  // (source + shadow), so the filters nest rather than stack; the whole
  // element render — text-shadows, stroke, and fill — is the chain's source.
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

  // text-shadow list: each shadow is drawn independently beneath the glyphs,
  // first-listed on top.
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

  // background-color: currentcolor sits beneath the background-image stack.
  const basePaint = Skia.Paint();
  basePaint.setColor(
    paint.color === null ? Skia.Color(fallbackColor) : skColor(paint.color),
  );
  drawGlyphs(basePaint);

  // background-image lists the topmost layer first, so draw back-to-front.
  // Gradient layers become gradient shaders; image (URL) layers become a
  // bitmap shader scaled to the layer rect, both clipped to the glyphs, the
  // way `background-clip: text` shows each background through the text.
  let skippedImageLayers = false;
  for (const layer of [...layout.layers].reverse()) {
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
    let shader: SkShader | null;
    if (layer.function === 'URL') {
      const image = frames.get(layer.image_url);
      if (!image) {
        skippedImageLayers = true;
        continue;
      }
      shader = imageLayerShader(image, canvasRect);
    } else {
      shader = layerShader(layer, canvasRect);
    }
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

  // -webkit-text-stroke paints over the fill (WebKit's default paint order),
  // centred on the glyph outline, so a centred Skia stroke of the same width
  // drawn last reproduces it, and staying inside the drop-shadow layer keeps
  // the stroke part of the shadow silhouette.
  if (layout.stroke) {
    const strokePaint = Skia.Paint();
    strokePaint.setStyle(PaintStyle.Stroke);
    strokePaint.setStrokeWidth(layout.stroke.width * scale);
    strokePaint.setColor(skColor(layout.stroke.color));
    drawGlyphs(strokePaint);
  }

  canvas.restore();
  return { skippedImageLayers };
}

export async function rasterizePaintedUsername(
  opts: RasterizePaintedUsernameOptions,
): Promise<RasterizedPaintedUsername | null> {
  const layout = buildPaintLayout(opts);
  if (!layout) {
    return null;
  }

  const { frames } = await decodePaintLayerImages(opts.paint);
  const surface = Skia.Surface.Make(
    layout.surfaceWidthPx,
    layout.surfaceHeightPx,
  );
  if (!surface) {
    return null;
  }

  const { skippedImageLayers } = drawPaintedUsername(
    surface.getCanvas(),
    opts,
    layout,
    frames,
  );

  const image = surface.makeImageSnapshot();
  const uri = `data:image/png;base64,${image.encodeToBase64(ImageFormat.PNG, 100)}`;
  const { scale } = layout;

  return {
    uri,
    width: layout.surfaceWidthPx / scale,
    height: layout.surfaceHeightPx / scale,
    insets: {
      left: layout.insetsPx.left / scale,
      top: layout.insetsPx.top / scale,
      right: layout.insetsPx.right / scale,
      bottom: layout.insetsPx.bottom / scale,
    },
    skippedImageLayers,
  };
}
