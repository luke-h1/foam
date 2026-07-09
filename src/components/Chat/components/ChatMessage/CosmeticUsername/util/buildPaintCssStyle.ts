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

/**
 * Mirrors `createGradientFromPaint` in the 7TV extension.
 */
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

/**
 * Mirrors `createFilterDropshadow` in the 7TV extension.
 */
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

function buildPaintCssBackgrounds(paint: PaintData): PaintCssBackground[] {
  return getPaintLayers(paint).map(cssBackgroundForLayer);
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
  const backgrounds = buildPaintCssBackgrounds(paint);
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

  // `fallbackColor` is only used when the paint has no layer stops; keep the
  // parameter so callers can pass the username tint without a second lookup.
  void fallbackColor;

  return style;
}

/**
 * Serializes extension-style paint CSS for an inline HTML `style` attribute.
 */
export function buildPaintCssInlineStyle(
  paint: PaintData,
  fallbackColor: string,
  dropShadowMode: PaintDropShadowMode,
): string {
  const style = buildPaintCssTextStyle(paint, fallbackColor, dropShadowMode);
  const declarations: string[] = [
    'background-clip: text',
    '-webkit-background-clip: text',
    '-webkit-text-fill-color: transparent',
    `font-weight: ${style.fontWeight ?? 700}`,
  ];

  if (style.color) {
    declarations.push(`color: ${String(style.color)}`);
  }
  if (style.backgroundColor) {
    declarations.push(`background-color: ${String(style.backgroundColor)}`);
  }
  if (style.backgroundImage) {
    declarations.push(`background-image: ${String(style.backgroundImage)}`);
  }
  if (style.backgroundPosition) {
    declarations.push(
      `background-position: ${String(style.backgroundPosition)}`,
    );
  }
  if (style.backgroundSize) {
    declarations.push(`background-size: ${String(style.backgroundSize)}`);
  }
  if (style.backgroundRepeat) {
    declarations.push(`background-repeat: ${String(style.backgroundRepeat)}`);
  }
  if (style.filter) {
    declarations.push(`filter: ${String(style.filter)}`);
  }
  if (style.textShadow) {
    declarations.push(`text-shadow: ${String(style.textShadow)}`);
  }
  if ('WebkitTextStrokeWidth' in style && style.WebkitTextStrokeWidth) {
    declarations.push(
      `-webkit-text-stroke-width: ${String(style.WebkitTextStrokeWidth)}`,
    );
  }
  if ('WebkitTextStrokeColor' in style && style.WebkitTextStrokeColor) {
    declarations.push(
      `-webkit-text-stroke-color: ${String(style.WebkitTextStrokeColor)}`,
    );
  }
  if (style.textTransform) {
    declarations.push(`text-transform: ${String(style.textTransform)}`);
  }

  return declarations.join('; ');
}
