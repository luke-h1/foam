/**
 * Verbatim port of the 7TV website's paint renderer
 * (SevenTV/apps/website/src/components/paint.svelte) - the oracle for v4
 * paint data. One span per layer, stacked in a grid, each clipped to the text.
 */
import { pickBestPaintLayerImage } from '@app/utils/color/sevenTvPaintData/pickBestPaintLayerImage';
import type { V4Paint } from '@app/utils/color/sevenTvPaintData/types';

type V4Layer = V4Paint['data']['layers'][number];

const hex = (color: { r: number; g: number; b: number; a: number }): string =>
  `rgba(${color.r}, ${color.g}, ${color.b}, ${(color.a / 255).toFixed(4)})`;

function layerToBackgroundImage(layer: V4Layer): string | undefined {
  const ty = layer.ty;
  switch (ty.__typename) {
    case 'PaintLayerTypeLinearGradient': {
      if (ty.stops.length === 0) {
        return undefined;
      }
      const repeating = ty.repeating ? 'repeating-' : '';
      const stops = ty.stops
        .map(stop => `${hex(stop.color)} ${stop.at * 100}%`)
        .join(', ');
      return `${repeating}linear-gradient(${ty.angle}deg, ${stops})`;
    }
    case 'PaintLayerTypeRadialGradient': {
      if (ty.stops.length === 0) {
        return undefined;
      }
      const repeating = ty.repeating ? 'repeating-' : '';
      const shape = ty.shape === 'ELLIPSE' ? 'ellipse' : 'circle';
      const stops = ty.stops
        .map(stop => `${hex(stop.color)} ${stop.at * 100}%`)
        .join(', ');
      return `${repeating}radial-gradient(${shape}, ${stops})`;
    }
    case 'PaintLayerTypeImage': {
      /**
       * The website always takes the 1x image; the harness takes the same
       * file the app picks so the diff measures geometry, not texture scale.
       */
      const image = pickBestPaintLayerImage(ty.images);
      return image ? `url(${image.url})` : undefined;
    }
    default:
      return undefined;
  }
}

function layerToBackgroundColor(layer: V4Layer): string | undefined {
  return layer.ty.__typename === 'PaintLayerTypeSingleColor'
    ? hex(layer.ty.color)
    : undefined;
}

export interface WebsiteLayerStyle {
  opacity: number;
  backgroundImage?: string;
  backgroundColor?: string;
  filter?: string;
}

export function websiteLayerStyles(paint: V4Paint): WebsiteLayerStyle[] {
  const filter = paint.data.shadows.length
    ? paint.data.shadows
        .map(
          shadow =>
            `drop-shadow(${hex(shadow.color)} ${shadow.offsetX}px ${shadow.offsetY}px ${shadow.blur}px)`,
        )
        .join(' ')
    : undefined;

  const layers = paint.data.layers
    .map(layer => {
      const backgroundImage = layerToBackgroundImage(layer);
      const backgroundColor = layerToBackgroundColor(layer);
      if (!backgroundImage && !backgroundColor) {
        return undefined;
      }
      return { opacity: layer.opacity, backgroundImage, backgroundColor };
    })
    .filter((layer): layer is WebsiteLayerStyle => layer !== undefined);

  // The website only puts the shadow filter on the first (bottom) layer.
  return layers.map((layer, index) => ({
    ...layer,
    filter: index === 0 ? filter : undefined,
  }));
}
