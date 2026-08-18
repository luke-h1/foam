// This file's shape usages are the 7TV paint API's PaintData/PaintLayerData.shape
// field (see types/seventv/cosmetics.ts), not a naming choice.
// oxlint-disable anti-slop/no-shape-in-symbol-names
import type { PaintLayerData } from '@app/types/seventv/cosmetics';

import {
  buildPaintImageLayers,
  type PaintImageLayer,
  planPaintLayerSlotKinds,
} from '../skiaPaintedUsernameRasterizer';

const createLayer = (
  overrides: Partial<PaintLayerData> = {},
): PaintLayerData => ({
  function: 'URL',
  stops: { length: 0 },
  angle: 0,
  shape: 'circle',
  repeat: false,
  image_url: '',
  canvas_repeat: 'unset',
  at: null,
  size: null,
  opacity: 1,
  ...overrides,
});

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
            0: { at: 0, color: 0xff0000ff },
            1: { at: 1, color: 0x0000ffff },
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

describe('planPaintLayerSlotKinds', () => {
  test('puts a gradient listed above a URL after the URL slot', () => {
    // CSS order: first = top. Gradient on top of URL → draw URL then gradient.
    expect(
      planPaintLayerSlotKinds([
        createLayer({
          function: 'LINEAR_GRADIENT',
          stops: {
            0: { at: 0, color: 0xff0000ff },
            1: { at: 1, color: 0x0000ffff },
            length: 2,
          },
        }),
        createLayer({ image_url: 'https://cdn.7tv.app/paint/under/1x.webp' }),
      ]),
    ).toEqual(['url', 'baked']);
  });

  test('puts a URL listed above a gradient after the baked gradient slot', () => {
    expect(
      planPaintLayerSlotKinds([
        createLayer({ image_url: 'https://cdn.7tv.app/paint/over/1x.webp' }),
        createLayer({
          function: 'LINEAR_GRADIENT',
          stops: {
            0: { at: 0, color: 0xff0000ff },
            1: { at: 1, color: 0x0000ffff },
            length: 2,
          },
        }),
      ]),
    ).toEqual(['baked', 'url']);
  });

  test('batches contiguous gradients between URL layers', () => {
    expect(
      planPaintLayerSlotKinds([
        createLayer({ image_url: 'https://cdn.7tv.app/paint/top/1x.webp' }),
        createLayer({
          function: 'LINEAR_GRADIENT',
          stops: {
            0: { at: 0, color: 0xff0000ff },
            1: { at: 1, color: 0x0000ffff },
            length: 2,
          },
        }),
        createLayer({
          function: 'RADIAL_GRADIENT',
          stops: {
            0: { at: 0, color: 0xff0000ff },
            1: { at: 1, color: 0x0000ffff },
            length: 2,
          },
        }),
        createLayer({ image_url: 'https://cdn.7tv.app/paint/bottom/1x.webp' }),
      ]),
    ).toEqual(['url', 'baked', 'url']);
  });

  test('renders no span for zero-stop gradients or fully transparent layers', () => {
    expect(
      planPaintLayerSlotKinds([
        createLayer({ function: 'LINEAR_GRADIENT' }),
        createLayer({
          image_url: 'https://cdn.7tv.app/paint/hidden/1x.webp',
          opacity: 0,
        }),
        createLayer({ image_url: 'https://cdn.7tv.app/paint/shown/1x.webp' }),
      ]),
    ).toEqual(['url']);
  });

  test('a dead URL layer does not split a gradient batch', () => {
    expect(
      planPaintLayerSlotKinds([
        createLayer({
          function: 'LINEAR_GRADIENT',
          stops: {
            0: { at: 0, color: 0xff0000ff },
            1: { at: 1, color: 0x0000ffff },
            length: 2,
          },
        }),
        createLayer({
          image_url: 'https://cdn.7tv.app/paint/hidden/1x.webp',
          opacity: 0,
        }),
        createLayer({
          function: 'RADIAL_GRADIENT',
          stops: {
            0: { at: 0, color: 0xff0000ff },
            1: { at: 1, color: 0x0000ffff },
            length: 2,
          },
        }),
      ]),
    ).toEqual(['baked']);
  });
});
