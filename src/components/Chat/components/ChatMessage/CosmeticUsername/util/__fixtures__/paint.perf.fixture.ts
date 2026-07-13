import {
  BLUE,
  makeLayer,
  makePaint,
  RED,
  toIndexed,
} from '@app/components/Chat/components/ChatMessage/CosmeticUsername/util/paintCss/__fixtures__/paintCss.fixture';
import { getPaintLayers } from '@app/components/Chat/components/ChatMessage/CosmeticUsername/util/paintLayer/getPaintLayers';
import type { PaintData, PaintLayerData } from '@app/types/seventv/cosmetics';

export const multiLayerPaint: PaintData = makePaint({
  id: 'perf-multi-layer',
  name: 'Perf Multi Layer',
  color: RED,
  layers: toIndexed<PaintLayerData>([
    makeLayer({
      function: 'LINEAR_GRADIENT',
      angle: 90,
      stops: toIndexed([
        { at: 0, color: RED },
        { at: 1, color: BLUE },
      ]),
    }),
    makeLayer({
      function: 'URL',
      image_url: 'https://cdn.7tv.app/paint/perf/1x.webp',
      canvas_repeat: 'repeat',
      repeat: true,
    }),
    makeLayer({
      function: 'URL',
      image_url: 'https://cdn.7tv.app/paint/perf-stretch/1x.webp',
    }),
    makeLayer({
      function: 'RADIAL_GRADIENT',
      shape: 'circle',
      stops: toIndexed([
        { at: 0, color: BLUE },
        { at: 1, color: RED },
      ]),
    }),
  ]),
  shadows: toIndexed([
    { x_offset: 1, y_offset: 1, radius: 2, color: 128 },
    { x_offset: -1, y_offset: 0, radius: 4, color: 64 },
  ]),
});

export const paintImageLayerLayout = {
  layers: getPaintLayers(multiLayerPaint),
  glyphWidthPx: 120,
  glyphHeightPx: 36,
  originX: 8,
  originY: 4,
  scale: 2,
};

export const paintedUsernames = Array.from(
  { length: 40 },
  (_, index) => `PaintedUser${index}`,
);
