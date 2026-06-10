import { indexedCollectionToArray } from '@app/services/ws/util/indexedCollection';
import { sevenTvColorToCss } from '@app/utils/color/sevenTvColorToCss';
import type {
  PaintData,
  PaintShadow,
  PaintTextStroke,
} from '@app/utils/color/seventv-ws-service';
import type { TextStyle } from 'react-native';

/**
 * Styles that change glyph shape (weight, transform). These must be applied
 * to the mask text, the fill sizer, and every shadow underlay so all layers
 * share identical metrics. Stroke and shadows are rendered as separate
 * underlay layers instead, matching the extension's compositing order
 * (shadow behind stroke behind fill).
 */
export function buildPaintUsernameTextStyle(paint: PaintData): TextStyle {
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
  const shadows = paint.textStyle?.shadows;
  return shadows ? indexedCollectionToArray(shadows) : [];
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
