import type { TextStyle } from 'react-native';

import type { PaintData } from '@app/types/seven-tv/cosmetics';

import { buildPaintCssDeclarations } from './buildPaintCssDeclarations';

export interface PaintFillTextStyle extends TextStyle {
  backgroundClip?: 'text';
  backgroundImage?: string;
  backgroundPosition?: string;
  backgroundRepeat?: string;
  backgroundSize?: string;
  WebkitBackgroundClip?: 'text';
  WebkitTextFillColor?: 'transparent';
}

/**
 * Web text style for one paint. The glyphs stay transparent and the paint
 * shows through `background-clip: text`, the same model the 7TV site uses.
 * Shadows stay on the hosted underlay, so this style does not set `filter`.
 */
export function buildPaintFillTextStyle(
  paint: PaintData,
  fallbackColor: string,
): PaintFillTextStyle {
  const css = buildPaintCssDeclarations(paint);
  const color = css.color === 'inherit' ? fallbackColor : css.color;

  if (css.backgroundImage === 'none') {
    return { color };
  }

  return {
    backgroundClip: 'text',
    backgroundColor: 'currentcolor',
    backgroundImage: css.backgroundImage,
    backgroundPosition: css.backgroundPosition,
    backgroundRepeat: css.backgroundRepeat,
    backgroundSize: css.backgroundSize,
    color,
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  };
}
