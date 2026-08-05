import { PaintRadialGradientShape } from '@app/graphql/generated/gql';
import { IndexedCollection } from '@app/services/ws/util/indexedCollection';
import type { PaintData, PaintShadow } from '@app/types/seventv/cosmetics';
import { pickBestPaintLayerImage } from '@app/utils/color/sevenTvPaintData/pickBestPaintLayerImage';
import type {
  SevenTvPaintSource,
  V4Paint,
} from '@app/utils/color/sevenTvPaintData/types';
import { normalizeSevenTvPaint } from '@app/utils/seventv/cosmetics/normalizeSevenTvPaint';
import type { PaintGradientLayer } from '@app/utils/seventv/cosmetics/types';

const packRgba = (color: {
  r: number;
  g: number;
  b: number;
  a: number;
}): number =>
  // eslint-disable-next-line no-bitwise
  ((color.r << 24) | (color.g << 16) | (color.b << 8) | color.a) >>> 0;

const convertV4Layer = (
  layer: V4Paint['data']['layers'][number],
): PaintGradientLayer | null => {
  const { ty, opacity } = layer;
  // eslint-disable-next-line no-underscore-dangle
  switch (ty.__typename) {
    case 'PaintLayerTypeLinearGradient':
      return {
        function: 'LINEAR_GRADIENT',
        angle: ty.angle,
        repeat: ty.repeating,
        stops: ty.stops.map(stop => ({
          at: stop.at,
          color: packRgba(stop.color),
        })),
        canvas_repeat: '',
        size: [1, 1],
        opacity,
      };
    case 'PaintLayerTypeRadialGradient':
      return {
        function: 'RADIAL_GRADIENT',
        repeat: ty.repeating,
        shape:
          ty.shape === PaintRadialGradientShape.Ellipse ? 'ellipse' : 'circle',
        stops: ty.stops.map(stop => ({
          at: stop.at,
          color: packRgba(stop.color),
        })),
        canvas_repeat: '',
        size: [1, 1],
        opacity,
      };
    case 'PaintLayerTypeSingleColor': {
      const packed = packRgba(ty.color);
      return {
        function: 'LINEAR_GRADIENT',
        stops: [
          { at: 0, color: packed },
          { at: 1, color: packed },
        ],
        canvas_repeat: '',
        size: [1, 1],
        opacity,
      };
    }
    case 'PaintLayerTypeImage':
      return {
        function: 'URL',
        image_url: pickBestPaintLayerImage(ty.images)?.url ?? '',
        stops: [],
        canvas_repeat: '',
        size: [1, 1],
        opacity,
      };
    default:
      return null;
  }
};

export const convertV4PaintToPaintData = (
  paint: SevenTvPaintSource,
): PaintData => {
  /**
   * v4 lists layers bottom-to-top (the website stacks them as sibling spans,
   * later siblings painting on top); `PaintData.layers` keeps the CSS
   * `background-image` convention of first-is-topmost, so reverse here.
   */
  const gradients = paint.data.layers
    .map(convertV4Layer)
    .filter((layer): layer is PaintGradientLayer => layer !== null)
    .reverse();

  const singleColorLayer = paint.data.layers.find(
    layer => layer.ty.__typename === 'PaintLayerTypeSingleColor',
  );
  const color =
    singleColorLayer?.ty.__typename === 'PaintLayerTypeSingleColor'
      ? packRgba(singleColorLayer.ty.color)
      : null;

  const shadowsIndexed: IndexedCollection<PaintShadow> = {
    length: paint.data.shadows.length,
  };

  paint.data.shadows.forEach((shadow, index) => {
    shadowsIndexed[index] = {
      color: packRgba(shadow.color),
      radius: shadow.blur,
      x_offset: shadow.offsetX,
      y_offset: shadow.offsetY,
    };
  });

  return normalizeSevenTvPaint({
    id: paint.id,
    name: paint.name,
    color,
    gradients,
    shadows: shadowsIndexed,
  });
};
