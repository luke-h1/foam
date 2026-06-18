import {
  PaintRadialGradientShape,
  type Image,
  type UserCosmeticsQuery,
} from '@app/graphql/generated/gql';
import {
  normalizeSevenTvPaint,
  type PaintGradientLayer,
} from '@app/components/Chat/util/normalizeSevenTvCosmetics';
import { IndexedCollection } from '@app/services/ws/util/indexedCollection';

import type { PaintData, PaintShadow } from './seventv-ws-service';

type V4User = NonNullable<UserCosmeticsQuery['users']['user']>;

export type V4Paint = NonNullable<V4User['style']['activePaint']>;

export type V4Badge = NonNullable<V4User['style']['activeBadge']>;

export type SevenTvPaintSource = Pick<V4Paint, 'id' | 'name' | 'data'>;

const packRgba = (color: {
  r: number;
  g: number;
  b: number;
  a: number;
}): number =>
  // eslint-disable-next-line no-bitwise
  ((color.r << 24) | (color.g << 16) | (color.b << 8) | color.a) >>> 0;

/**
 * Pick the best format from a set of images at the same scale.
 * Prefers AVIF > WebP > first available.
 */
export function pickBestFormat(imgs: Image[]): Image | undefined {
  return (
    imgs.find(img => img.mime === 'image/avif') ??
    imgs.find(img => img.mime === 'image/webp') ??
    imgs[0]
  );
}

export function pickBestImage(images: readonly Image[]): Image | undefined {
  const scales = [4, 3, 2, 1];

  return scales.reduce<Image | undefined>((found, targetScale) => {
    if (found) {
      return found;
    }

    const atScale = images.filter(img => img.scale === targetScale);
    if (atScale.length === 0) {
      return undefined;
    }

    const animated = atScale.filter(img => img.frameCount > 1);
    return animated.length > 0
      ? pickBestFormat(animated)
      : pickBestFormat(atScale);
  }, undefined);
}

/**
 * Animated frames: WebP (VP8) > GIF > AVIF. expo-image decodes WebP far cheaper
 * than AVIF (which routes through software dav1d), so this is the preferred
 * animated format for both paints and emotes.
 */
export function pickAnimatedFormat(imgs: Image[]): Image | undefined {
  return (
    imgs.find(img => img.mime === 'image/webp') ??
    imgs.find(img => img.mime === 'image/gif') ??
    imgs.find(img => img.mime === 'image/avif') ??
    imgs[0]
  );
}

/**
 * Pick the image URL for a paint's image layer. Animated paints prefer an
 * animated format expo-image can loop; static paints fall back to pickBestImage.
 */
export function pickBestPaintLayerImage(
  images: readonly Image[],
): Image | undefined {
  for (const targetScale of [4, 3, 2, 1]) {
    const animatedAtScale = images.filter(
      img => img.scale === targetScale && img.frameCount > 1,
    );
    if (animatedAtScale.length > 0) {
      return pickAnimatedFormat(animatedAtScale);
    }
  }

  return pickBestImage(images);
}

const convertV4Layer = (
  layer: V4Paint['data']['layers'][number],
): PaintGradientLayer | null => {
  const { ty } = layer;
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
      };
    }
    case 'PaintLayerTypeImage':
      return {
        function: 'URL',
        image_url: pickBestPaintLayerImage(ty.images)?.url ?? '',
        stops: [],
        canvas_repeat: '',
        size: [1, 1],
      };
    default:
      return null;
  }
};

export const convertV4PaintToPaintData = (
  paint: SevenTvPaintSource,
): PaintData => {
  const gradients = paint.data.layers
    .map(convertV4Layer)
    .filter((layer): layer is PaintGradientLayer => layer !== null);

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
