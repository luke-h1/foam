import type { TextStyle } from 'react-native';

import type { PaintData } from '@app/types/seventv/cosmetics';

// Memoised on the paint object so every user wearing a shared paint reuses
// one result; WeakMap-keyed so entries drop with the paint.
const textStyleCache = new WeakMap<PaintData, TextStyle>();

/**
 * Styles that change glyph shape (weight, transform), applied to the mask
 * text, fill sizer and every shadow underlay so all layers share identical metrics.
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
    // SAFETY: 7TV paint weights are CSS weights divided by 100, so weight * 100 is one of '100'-'900'.
    style.fontWeight = String(
      textStyle.weight * 100,
    ) as TextStyle['fontWeight'];
  }

  if (textStyle.transform) {
    style.textTransform = textStyle.transform;
  }

  return style;
}
