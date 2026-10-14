// "shape" is the 7TV paint API field (types/seven-tv/cosmetics.ts), not a naming choice.
// oxlint-disable anti-slop/no-shape-in-symbol-names
import { buildLayerGradientConfig } from '@app/components/chat/components/chat-message/cosmetic-username/util/paint-layer/build-layer-gradient-config';
import { getPaintDropShadows } from '@app/components/chat/components/chat-message/cosmetic-username/util/paint-layer/get-paint-drop-shadows';
import { getPaintLayers } from '@app/components/chat/components/chat-message/cosmetic-username/util/paint-layer/get-paint-layers';
import { isRenderablePaintLayer } from '@app/components/chat/components/chat-message/cosmetic-username/util/paint-layer/is-renderable-paint-layer';
import { isTilingCanvasRepeat } from '@app/components/chat/components/chat-message/cosmetic-username/util/paint-layer/is-tiling-canvas-repeat';
import { getPaintTextShadows } from '@app/components/chat/components/chat-message/cosmetic-username/util/paint-text-style/get-paint-text-shadows';
import { getPaintTextStroke } from '@app/components/chat/components/chat-message/cosmetic-username/util/paint-text-style/get-paint-text-stroke';
import { cssDropShadowBlur } from '@app/components/chat/components/chat-message/cosmetic-username/util/skia-paint-geometry/css-drop-shadow-blur';
import { cssTextShadowBlur } from '@app/components/chat/components/chat-message/cosmetic-username/util/skia-paint-geometry/css-text-shadow-blur';
import { paintShadowExtents } from '@app/components/chat/components/chat-message/cosmetic-username/util/skia-paint-geometry/paint-shadow-extents';
import type {
  PaintCanvasRepeat,
  PaintData,
  PaintLayerData,
  PaintShadow,
} from '@app/types/seven-tv/cosmetics';
import { isVisibleSevenTvColor } from '@app/utils/color/is-visible-seven-tv-color';
import { sevenTvColorToCss } from '@app/utils/color/seven-tv-color-to-css';
import type {
  NativeChatPaint,
  NativeChatPaintLayer,
  NativeChatPaintShadow,
  NativeChatPaintTile,
} from '@modules/native-chat-list/src/NativeChatList.types';

/**
 * Keyed on the paint object, then on the fallback colour. A paint is shared
 * by every user wearing it, so most rows reuse one result.
 */
const paintCache = new WeakMap<PaintData, Map<string, NativeChatPaint>>();
const paintRevisions = new WeakMap<PaintData, number>();
let nextPaintRevision = 1;

function getPaintRevision(paint: PaintData): number {
  const existing = paintRevisions.get(paint);

  if (existing !== undefined) {
    return existing;
  }

  const revision = nextPaintRevision;
  nextPaintRevision += 1;
  paintRevisions.set(paint, revision);
  return revision;
}

function toShadow(
  shadow: PaintShadow,
  blur: (radius: number) => number,
): NativeChatPaintShadow {
  return {
    blur: blur(shadow.radius),
    color: sevenTvColorToCss(shadow.color),
    x: shadow.x_offset,
    y: shadow.y_offset,
  };
}

function toTile(
  canvasRepeat: PaintCanvasRepeat,
  repeat: boolean,
): NativeChatPaintTile {
  if (!isTilingCanvasRepeat(canvasRepeat, repeat)) {
    return 'none';
  }

  if (canvasRepeat === 'repeat-x' || canvasRepeat === 'repeat-y') {
    return canvasRepeat;
  }

  return 'repeat';
}

function toLayer(layer: PaintLayerData): NativeChatPaintLayer | null {
  if (layer.function === 'URL') {
    return {
      kind: 'image',
      opacity: layer.opacity,
      at: layer.at,
      size: layer.size,
      colors: [],
      locations: [],
      angle: 0,
      ellipse: false,
      url: layer.image_url,
      tile: toTile(layer.canvas_repeat, layer.repeat),
    };
  }

  const gradient = buildLayerGradientConfig(layer);

  if (!gradient) {
    return null;
  }

  return {
    kind: layer.function === 'LINEAR_GRADIENT' ? 'linear' : 'radial',
    opacity: layer.opacity,
    at: layer.at,
    size: layer.size,
    colors: gradient.colors,
    locations: gradient.locations,
    angle: layer.angle ?? 0,
    ellipse: layer.shape === 'ellipse',
    tile: 'none',
  };
}

function createNativeChatPaint(
  paint: PaintData,
  fallbackColor: string,
): NativeChatPaint {
  const dropShadows = getPaintDropShadows(paint, 2);
  const textShadows = getPaintTextShadows(paint);
  const stroke = getPaintTextStroke(paint);

  const baseColor = isVisibleSevenTvColor(paint.color)
    ? sevenTvColorToCss(paint.color)
    : fallbackColor;

  const layers = [...getPaintLayers(paint)].reverse().flatMap(layer => {
    const nativeLayer = isRenderablePaintLayer(layer) ? toLayer(layer) : null;
    return nativeLayer ? [nativeLayer] : [];
  });

  return {
    key: `${paint.id}|${getPaintRevision(paint)}|${baseColor}`,
    baseColor,
    dropShadows: dropShadows.map(shadow => toShadow(shadow, cssDropShadowBlur)),
    insets: paintShadowExtents(dropShadows, textShadows, stroke?.width ?? 0),
    layers,
    stroke: stroke
      ? { color: sevenTvColorToCss(stroke.color), width: stroke.width }
      : undefined,
    textShadows: textShadows.map(shadow => toShadow(shadow, cssTextShadowBlur)),
  };
}

/**
 * The paint as the native list draws it, following the Skia rasterizer
 * (`skia-painted-username-rasterizer.ts`): the same layer order, shadow blur
 * and padding.
 */
export function buildNativeChatPaint(
  paint: PaintData,
  fallbackColor: string,
): NativeChatPaint {
  let byColor = paintCache.get(paint);

  if (!byColor) {
    byColor = new Map();
    paintCache.set(paint, byColor);
  }

  const cached = byColor.get(fallbackColor);

  if (cached) {
    return cached;
  }

  const built = createNativeChatPaint(paint, fallbackColor);
  byColor.set(fallbackColor, built);
  return built;
}
