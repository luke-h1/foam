import type { PaintLayerData } from '@app/types/seven-tv/cosmetics';

import { makeLayer } from '../paint-css/__fixtures__/paintCss.fixture';
import {
  buildPaintImageLayers,
  type PaintImageLayer,
} from '../skiaPaintedUsernameRasterizer';

const createLayer = (overrides: Partial<PaintLayerData> = {}) =>
  makeLayer({ function: 'URL', canvas_repeat: 'unset', ...overrides });

const layoutBox = {
  glyphWidthPx: 100,
  glyphHeightPx: 40,
  originX: 10,
  originY: 6,
  scale: 2,
};

describe('buildPaintImageLayers', () => {
  test('maps a stretching image layer to its logical rect', () => {
    const layers = buildPaintImageLayers({
      ...layoutBox,
      layers: [
        createLayer({ image_url: 'https://cdn.7tv.app/paint/abc/1x.webp' }),
      ],
    });

    expect(layers).toEqual<PaintImageLayer[]>([
      {
        url: 'https://cdn.7tv.app/paint/abc/1x.webp',
        rect: { x: 5, y: 3, width: 50, height: 20 },
        tile: null,
        opacity: 1,
      },
    ]);
  });

  test('maps a tiling image layer to tile modes without a rect', () => {
    const layers = buildPaintImageLayers({
      ...layoutBox,
      layers: [
        createLayer({
          image_url: 'https://cdn.7tv.app/paint/abc/1x.webp',
          canvas_repeat: 'repeat-x',
        }),
      ],
    });

    expect(layers).toEqual<PaintImageLayer[]>([
      {
        url: 'https://cdn.7tv.app/paint/abc/1x.webp',
        rect: null,
        tile: { tx: 'repeat', ty: 'decal' },
        opacity: 1,
      },
    ]);
  });

  test('swaps a static avif layer url to its webp sibling', () => {
    const layers = buildPaintImageLayers({
      ...layoutBox,
      layers: [
        createLayer({ image_url: 'https://cdn.7tv.app/paint/abc/1x.avif' }),
      ],
    });

    expect(layers).toEqual<PaintImageLayer[]>([
      {
        url: 'https://cdn.7tv.app/paint/abc/1x.webp',
        rect: { x: 5, y: 3, width: 50, height: 20 },
        tile: null,
        opacity: 1,
      },
    ]);
  });

  test('returns every image layer in back-to-front draw order', () => {
    const layers = buildPaintImageLayers({
      ...layoutBox,
      layers: [
        createLayer({ image_url: 'https://cdn.7tv.app/paint/top/1x.webp' }),
        createLayer({
          function: 'LINEAR_GRADIENT',
          stops: {
            0: { at: 0, color: 0xff_00_00_ff },
            1: { at: 1, color: 0x00_00_ff_ff },
            length: 2,
          },
        }),
        createLayer({
          image_url: 'https://cdn.7tv.app/paint/bottom/1x.webp',
          repeat: true,
        }),
      ],
    });

    expect(layers).toEqual<PaintImageLayer[]>([
      {
        url: 'https://cdn.7tv.app/paint/bottom/1x.webp',
        rect: null,
        tile: { tx: 'repeat', ty: 'repeat' },
        opacity: 1,
      },
      {
        url: 'https://cdn.7tv.app/paint/top/1x.webp',
        rect: { x: 5, y: 3, width: 50, height: 20 },
        tile: null,
        opacity: 1,
      },
    ]);
  });

  test('threads v4 layer opacity through and skips fully transparent layers', () => {
    const layers = buildPaintImageLayers({
      ...layoutBox,
      layers: [
        createLayer({
          image_url: 'https://cdn.7tv.app/paint/faded/1x.webp',
          opacity: 0.5,
        }),
        createLayer({
          image_url: 'https://cdn.7tv.app/paint/hidden/1x.webp',
          opacity: 0,
        }),
      ],
    });

    expect(layers).toEqual<PaintImageLayer[]>([
      {
        url: 'https://cdn.7tv.app/paint/faded/1x.webp',
        rect: { x: 5, y: 3, width: 50, height: 20 },
        tile: null,
        opacity: 0.5,
      },
    ]);
  });

  test('skips gradient layers and url layers without an image', () => {
    const layers = buildPaintImageLayers({
      ...layoutBox,
      layers: [
        createLayer({ function: 'RADIAL_GRADIENT' }),
        createLayer({ image_url: '' }),
      ],
    });

    expect(layers).toEqual<PaintImageLayer[]>([]);
  });
});
