import type { TextStyle } from 'react-native';

import type { PaintData } from '@app/types/seven-tv/cosmetics';

import { paintCssFontWeight } from './paintFont';

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

  return {
    ...(textStyle.weight
      ? {
          // SAFETY: paintCssFontWeight maps the 7TV weight (1-9) onto '100'-'900'.
          fontWeight: String(
            paintCssFontWeight(textStyle.weight),
          ) as TextStyle['fontWeight'],
        }
      : null),
    ...(textStyle.transform ? { textTransform: textStyle.transform } : null),
  };
}
