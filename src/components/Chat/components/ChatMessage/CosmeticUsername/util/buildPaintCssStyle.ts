import type { TextStyle } from 'react-native';

import { indexedCollectionToArray } from '@app/services/ws/util/indexedCollection';
import type {
  PaintData,
  PaintLayerData,
  PaintShadow,
} from '@app/types/seventv/cosmetics';
import { sevenTvColorToCss } from '@app/utils/color/sevenTvColorToCss';

import {
  getPaintDropShadows,
  getPaintLayers,
  type PaintDropShadowMode,
} from './paintLayer';
import {
  buildPaintUsernameTextStyle,
  getPaintTextShadows,
  getPaintTextStroke,
} from './paintTextStyle';

type PaintCssBackground = {
  image: string;
  position: string;
  size: string;
  repeat: string;
};

function cssGradientFunction(layer: PaintLayerData): string {
  const stops = indexedCollectionToArray(layer.stops)
    .slice()
    .sort((a, b) => a.at - b.at)
    .map(stop => `${sevenTvColorToCss(stop.color)} ${stop.at * 100}%`);

  if (layer.function === 'URL') {
    return layer.image_url ? `url("${layer.image_url}")` : 'none';
  }

  const prefix = layer.repeat ? 'repeating-' : '';
  if (layer.function === 'RADIAL_GRADIENT') {
    return `${prefix}radial-gradient(${layer.shape ?? 'circle'}, ${stops.join(', ')})`;
  }

  return `${prefix}linear-gradient(${layer.angle ?? 0}deg, ${stops.join(', ')})`;
}

function cssBackgroundForLayer(layer: PaintLayerData): PaintCssBackground {
  const at = layer.at;
  const size = layer.size;

  return {
    image: cssGradientFunction(layer),
    position: at && at.length === 2 ? `${at[0] * 100}% ${at[1] * 100}%` : '',
    size:
      size && size.length === 2 ? `${size[0] * 100}% ${size[1] * 100}%` : '',
    repeat:
      layer.canvas_repeat && layer.canvas_repeat !== 'unset'
        ? layer.canvas_repeat
        : 'unset',
  };
}

function cssDropShadowFilter(shadow: PaintShadow): string {
  return `drop-shadow(${shadow.x_offset}px ${shadow.y_offset}px ${shadow.radius}px ${sevenTvColorToCss(shadow.color)})`;
}

function cssTextShadows(shadows: PaintShadow[]): string | undefined {
  if (shadows.length === 0) {
    return undefined;
  }

  return shadows
    .map(
      shadow =>
        `${shadow.x_offset}px ${shadow.y_offset}px ${shadow.radius}px ${sevenTvColorToCss(shadow.color)}`,
    )
    .join(', ');
}

/**
 * Builds the CSS paint styles the 7TV extension applies per paint id
 * (background-clip text, filter drop-shadows, text stroke, etc.).
 */
export function buildPaintCssTextStyle(
  paint: PaintData,
  fallbackColor: string,
  dropShadowMode: PaintDropShadowMode,
): TextStyle {
  const layers = getPaintLayers(paint);
  const backgrounds = layers.map(cssBackgroundForLayer);
  const paintTextStyle = buildPaintUsernameTextStyle(paint);
  const textShadows = getPaintTextShadows(paint);
  const stroke = getPaintTextStroke(paint);
  const dropShadows = getPaintDropShadows(paint, dropShadowMode);
  const filter =
    dropShadows.length > 0
      ? dropShadows.map(cssDropShadowFilter).join(' ')
      : undefined;

  // Mirror `.seventv-painted-content` + per-paint rules from the extension:
  // `background-color: currentcolor` with `color: inherit` when the paint has
  // no solid color, otherwise an explicit packed RGBA on both properties.
  const paintCssColor =
    paint.color !== null ? sevenTvColorToCss(paint.color) : undefined;

  const style: TextStyle = {
    ...paintTextStyle,
    backgroundClip: 'text',
    // @ts-expect-error RN web accepts vendor-prefixed clip properties.
    WebkitBackgroundClip: 'text',
    // @ts-expect-error RN web accepts vendor-prefixed fill properties.
    WebkitTextFillColor: 'transparent',
    fontWeight: paintTextStyle.fontWeight ?? '700',
    ...(paintCssColor
      ? { color: paintCssColor, backgroundColor: paintCssColor }
      : { color: 'inherit', backgroundColor: 'currentColor' }),
    ...(backgrounds.length > 0
      ? {
          backgroundImage: backgrounds.map(entry => entry.image).join(', '),
          backgroundPosition: backgrounds
            .map(entry => entry.position)
            .join(', '),
          backgroundSize: backgrounds.map(entry => entry.size).join(', '),
          backgroundRepeat: backgrounds.map(entry => entry.repeat).join(', '),
        }
      : {}),
    ...(filter ? { filter } : {}),
    ...(textShadows.length > 0
      ? { textShadow: cssTextShadows(textShadows) }
      : {}),
    ...(stroke
      ? {
          // @ts-expect-error RN web maps vendor-prefixed stroke properties.
          WebkitTextStrokeWidth: `${stroke.width}px`,
          // @ts-expect-error RN web maps vendor-prefixed stroke properties.
          WebkitTextStrokeColor: sevenTvColorToCss(stroke.color),
        }
      : {}),
  };

  return style;
}
