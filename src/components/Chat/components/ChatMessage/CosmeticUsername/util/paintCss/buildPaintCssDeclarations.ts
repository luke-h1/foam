import { getPaintLayers } from '@app/components/Chat/components/ChatMessage/CosmeticUsername/util/paintLayer/getPaintLayers';
import { indexedCollectionToArray } from '@app/services/ws/util/indexedCollection';
import type {
  PaintData,
  PaintLayerData,
  PaintStop,
} from '@app/types/seventv/cosmetics';
import { sevenTvColorToCss } from '@app/utils/color/sevenTvColorToCss';
import { sevenTvColorToRgba } from '@app/utils/color/sevenTvColorToRgba';

import type { PaintCssDeclarations } from './types';
import { webKitSafeLayerImageUrl } from './webKitSafeLayerImageUrl';

type CssLayer = {
  image: string;
  position: string;
  size: string;
  repeat: string;
};

function stopColorCss(color: number, layerOpacity: number): string {
  if (layerOpacity >= 1) {
    return sevenTvColorToCss(color);
  }
  const { r, g, b, a } = sevenTvColorToRgba(color);
  return `rgba(${r}, ${g}, ${b}, ${((a / 255) * layerOpacity).toFixed(3)})`;
}

/**
 * Stops stay in written order - the browser clamps out-of-order positions
 * itself (css-images-3 §3.4.2). Layer opacity folds into each stop's alpha,
 * since a single-element background list has no per-layer opacity.
 */
function cssStopList(layer: PaintLayerData): string {
  const layerOpacity = layer.opacity ?? 1;
  return indexedCollectionToArray<PaintStop>(layer.stops)
    .map(stop => `${stopColorCss(stop.color, layerOpacity)} ${stop.at * 100}%`)
    .join(', ');
}

function cssLayer(layer: PaintLayerData): CssLayer {
  let image: string;
  switch (layer.function) {
    case 'LINEAR_GRADIENT':
      image = `${layer.repeat ? 'repeating-' : ''}linear-gradient(${layer.angle ?? 0}deg, ${cssStopList(layer)})`;
      break;
    case 'RADIAL_GRADIENT':
      image = `${layer.repeat ? 'repeating-' : ''}radial-gradient(${layer.shape ?? 'circle'}, ${cssStopList(layer)})`;
      break;
    case 'URL':
      // Empty URLs are skipped by Skia/RN paths; emit `none` so invalid
      // `url()` cannot wipe a comma-separated background-image list.
      image = layer.image_url
        ? `url(${webKitSafeLayerImageUrl(layer.image_url)})`
        : 'none';
      break;
    default:
      image = 'none';
      break;
  }

  return {
    image,
    // Extension emits empty position/size; standalone CSS needs initials.
    position: layer.at
      ? `${layer.at[0] * 100}% ${layer.at[1] * 100}%`
      : '0% 0%',
    size: layer.size
      ? `${layer.size[0] * 100}% ${layer.size[1] * 100}%`
      : 'auto',
    repeat: layer.canvas_repeat || 'unset',
  };
}

export function buildPaintCssDeclarations(
  paint: PaintData,
): PaintCssDeclarations {
  const layers = getPaintLayers(paint).map(cssLayer);
  const shadows = indexedCollectionToArray(paint.shadows);
  const textStyle = paint.textStyle;
  const textShadows = textStyle?.shadows
    ? indexedCollectionToArray(textStyle.shadows)
    : [];

  return {
    color: paint.color === null ? 'inherit' : sevenTvColorToCss(paint.color),
    backgroundImage: layers.map(layer => layer.image).join(', ') || 'none',
    backgroundPosition:
      layers.map(layer => layer.position).join(', ') || '0% 0%',
    backgroundSize: layers.map(layer => layer.size).join(', ') || 'auto',
    backgroundRepeat: layers.map(layer => layer.repeat).join(', ') || 'unset',
    filter:
      shadows
        .map(
          shadow =>
            `drop-shadow(${shadow.x_offset}px ${shadow.y_offset}px ${shadow.radius}px ${sevenTvColorToCss(shadow.color)})`,
        )
        .join(' ') || 'inherit',
    fontWeight: textStyle?.weight ? String(textStyle.weight * 100) : 'inherit',
    webkitTextStrokeWidth: textStyle?.stroke
      ? `${textStyle.stroke.width}px`
      : 'inherit',
    webkitTextStrokeColor: textStyle?.stroke
      ? sevenTvColorToCss(textStyle.stroke.color)
      : 'inherit',
    textShadow:
      textShadows
        .map(
          shadow =>
            `${shadow.x_offset}px ${shadow.y_offset}px ${shadow.radius}px ${sevenTvColorToCss(shadow.color)}`,
        )
        .join(', ') || 'unset',
    textTransform: textStyle?.transform ?? 'unset',
  };
}
