import { indexedCollectionToArray } from '@app/services/ws/util/indexedCollection';
import { sevenTvColorToCss } from '@app/utils/color/sevenTvColorToCss';
import type { PaintData } from '@app/utils/color/seventv-ws-service';
import type { TextStyle } from 'react-native';
import { paintShadowToTextStyle } from './paintLayer';

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

  if (textStyle.stroke?.width) {
    style.textShadowColor = sevenTvColorToCss(textStyle.stroke.color);
    style.textShadowOffset = { width: 0, height: 0 };
    style.textShadowRadius = textStyle.stroke.width;
  }

  const shadows = textStyle.shadows
    ? indexedCollectionToArray(textStyle.shadows)
    : [];
  const firstShadow = shadows[0];
  if (firstShadow) {
    Object.assign(style, paintShadowToTextStyle(firstShadow));
  }

  return style;
}
