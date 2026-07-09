import type { TextStyle } from 'react-native';

import { indexedCollectionToArray } from '@app/services/ws/util/indexedCollection';
import type {
  PaintData,
  PaintShadow,
  PaintTextStroke,
} from '@app/types/seventv/cosmetics';
import { sevenTvColorToCss } from '@app/utils/color/sevenTvColorToCss';

/**
 * CSS `filter: drop-shadow()` glow reads much larger than RN `textShadowRadius`
 * at the same numeric radius. Chatterino 7TV uses the same multiplier to match
 * the browser extension on native Qt filters.
 */
export const NATIVE_DROP_SHADOW_RADIUS_MULTIPLIER = 3;

const textStyleCache = new WeakMap<PaintData, TextStyle>();
const textShadowsCache = new WeakMap<PaintData, PaintShadow[]>();

/**
 * Styles that change glyph shape (weight, transform). These must be applied
 * to the mask text, the fill sizer, and every shadow underlay so all layers
 * share identical metrics. Stroke and shadows are rendered as separate
 * underlay layers instead, matching the extension's compositing order
 * (shadow behind stroke behind fill).
 */
export function buildPaintUsernameTextStyle(paint: PaintData): TextStyle {
  const cached = textStyleCache.get(paint);
  if (cached) {
    return cached;
  }
  const style = computePaintUsernameTextStyle(paint);
  textStyleCache.set(paint, style);
  return style;
}

function computePaintUsernameTextStyle(paint: PaintData): TextStyle {
  const textStyle = paint.textStyle;
  if (!textStyle) {
    return {};
  }

  const style: TextStyle = {};

  if (textStyle.weight) {
    style.fontWeight = String(
      textStyle.weight * 100,
    ) as TextStyle['fontWeight'];
  }

  if (textStyle.transform) {
    style.textTransform = textStyle.transform;
  }

  return style;
}

export function getPaintTextShadows(paint: PaintData): PaintShadow[] {
  const cached = textShadowsCache.get(paint);
  if (cached) {
    return cached;
  }
  const shadows = paint.textStyle?.shadows;
  const result = shadows ? indexedCollectionToArray(shadows) : [];
  textShadowsCache.set(paint, result);
  return result;
}

export function getPaintTextStroke(paint: PaintData): PaintTextStroke | null {
  const stroke = paint.textStyle?.stroke;
  return stroke?.width ? stroke : null;
}

/**
 * Approximates -webkit-text-stroke with a same-position glyph copy in the
 * stroke color, blurred outward by the stroke width.
 */
export function paintStrokeToShadow(stroke: PaintTextStroke): PaintShadow {
  return {
    color: stroke.color,
    radius: stroke.width,
    x_offset: 0,
    y_offset: 0,
  };
}

export function paintShadowTextColor(shadow: PaintShadow): string {
  return sevenTvColorToCss(shadow.color);
}

/**
 * Scales paint drop-shadow radius on native so glow layers match the extension.
 */
export function scaleNativeDropShadow(shadow: PaintShadow): PaintShadow {
  const radius = shadow.radius ?? 0;
  if (radius <= 0) {
    return shadow;
  }

  return {
    ...shadow,
    radius: radius * NATIVE_DROP_SHADOW_RADIUS_MULTIPLIER,
  };
}
