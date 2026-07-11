import type { TextStyle } from 'react-native';

import type { PaintData } from '@app/types/seventv/cosmetics';

// Paint-pure derivations, memoised on the paint object so every user wearing a
// shared paint reuses one computed result (the 7TV extension computes each
// paint's style once, not per user). WeakMap-keyed so entries drop with the
// paint; no eviction needed.
const textStyleCache = new WeakMap<PaintData, TextStyle>();

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
