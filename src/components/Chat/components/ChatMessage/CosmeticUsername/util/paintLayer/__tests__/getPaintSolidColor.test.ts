import type { PaintData, PaintLayerData } from '@app/types/seventv/cosmetics';

import { getPaintSolidColor } from '../getPaintSolidColor';

function createLayer(overrides: Partial<PaintLayerData>): PaintLayerData {
  return {
    function: 'LINEAR_GRADIENT',
    image_url: '',
    stops: { length: 0 },
    angle: 0,
    shape: 'circle',
    repeat: false,
    canvas_repeat: '',
    at: null,
    size: null,
    opacity: 1,
    ...overrides,
  };
}

function createPaint(overrides: Partial<PaintData>): PaintData {
  return {
    id: 'paint-1',
    name: 'Paint',
    color: null,
    layers: { length: 0 },
    shadows: { length: 0 },
    textStyle: null,
    function: 'LINEAR_GRADIENT',
    repeat: false,
    angle: 0,
    shape: 'circle',
    image_url: '',
    stops: { length: 0 },
    ...overrides,
  };
}

describe('getPaintSolidColor', () => {
  test('prefers the paint solid colour', () => {
    const paint = createPaint({
      color: 0x9c28a9ff,
      layers: {
        0: createLayer({
          stops: { 0: { at: 0, color: 0x00ff00ff }, length: 1 },
        }),
        length: 1,
      },
    });

    expect(getPaintSolidColor(paint)).toBe('rgba(156, 40, 169, 1.000)');
  });

  test('falls back to the mid-most stop of a colourless gradient', () => {
    const paint = createPaint({
      layers: {
        0: createLayer({
          stops: {
            0: { at: 0, color: 0xff0000ff },
            1: { at: 0.6, color: 0x00ff00ff },
            2: { at: 1, color: 0x0000ffff },
            length: 3,
          },
        }),
        length: 1,
      },
    });

    expect(getPaintSolidColor(paint)).toBe('rgba(0, 255, 0, 1.000)');
  });

  test('reads the topmost renderable layer, skipping transparent stops', () => {
    const paint = createPaint({
      layers: {
        0: createLayer({
          function: 'URL',
          image_url: 'https://cdn.7tv.app/paint/abc/1x.webp',
        }),
        1: createLayer({
          stops: {
            0: { at: 0.5, color: 0x00ff0000 },
            1: { at: 0.9, color: 0x00ff00ff },
            length: 2,
          },
        }),
        2: createLayer({
          stops: { 0: { at: 0.5, color: 0x0000ffff }, length: 1 },
        }),
        length: 3,
      },
    });

    expect(getPaintSolidColor(paint)).toBe('rgba(0, 255, 0, 1.000)');
  });

  test('gives no colour for a paint that only carries a texture', () => {
    const paint = createPaint({
      layers: {
        0: createLayer({
          function: 'URL',
          image_url: 'https://cdn.7tv.app/paint/abc/1x.webp',
        }),
        length: 1,
      },
    });

    expect(getPaintSolidColor(paint)).toBeNull();
  });
});
