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
 * Styles that change glyph shape (weight, transform). Applied to every painted
 * username layer so mask, fill, and shadow copies share identical metrics.
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
