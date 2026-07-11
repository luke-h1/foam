import type { IndexedCollection } from '@app/services/ws/util/indexedCollection';
import type { PaintStop } from '@app/types/seventv/cosmetics';

import { normalizeSevenTvPaint } from '../normalizeSevenTvPaint';

const pickFields = (value: unknown, keys: readonly string[]) =>
  Object.fromEntries(
    keys.map(key => [key, (value as Record<string, unknown>)[key]]),
  );

describe('normalizeSevenTvPaint', () => {
  test('normalizes legacy flat paint fields', () => {
    const paint = normalizeSevenTvPaint({
      id: 'paint-v2',
      name: 'V2 Paint',
      color: 0xff0000ff,
      function: 'LINEAR_GRADIENT',
      angle: 45,
      repeat: true,
      shape: 'circle',
      image_url: '',
      stops: {
        0: { at: 0, color: 0xff0000ff },
        1: { at: 1, color: 0x0000ffff },
        length: 2,
      },
    });

    expect(
      pickFields(paint, ['id', 'function', 'angle', 'repeat', 'stops']),
    ).toEqual({
      id: 'paint-v2',
      function: 'LINEAR_GRADIENT',
      angle: 45,
      repeat: true,
      stops: {
        0: { at: 0, color: 0xff0000ff },
        1: { at: 1, color: 0x0000ffff },
        length: 2,
      },
    });
  });

  test('normalizes every gradients layer when gradients array is present', () => {
    const paint = normalizeSevenTvPaint({
      id: 'paint-v3',
      name: 'V3 Paint',
      color: null,
      gradients: [
        {
          function: 'RADIAL_GRADIENT',
          shape: 'ellipse',
          repeat: false,
          stops: [
            { at: 0, color: 0xffffffff },
            { at: 1, color: 0x000000ff },
          ],
        },
        {
          function: 'LINEAR_GRADIENT',
          angle: 90,
          repeat: false,
          stops: [{ at: 0, color: 0x12345678 }],
        },
      ],
    });

    expect(paint.function).toBe('RADIAL_GRADIENT');
    expect(paint.shape).toBe('ellipse');
    expect(paint.layers.length).toBe(2);
    expect(paint.layers[1]?.function).toBe('LINEAR_GRADIENT');
    expect(paint.stops).toEqual<IndexedCollection<PaintStop>>({
      0: { at: 0, color: 0xffffffff },
      1: { at: 1, color: 0x000000ff },
      length: 2,
    });
  });

  test('preserves all gradient layers', () => {
    const paint = normalizeSevenTvPaint({
      id: 'multi-layer',
      name: 'Multi',
      gradients: [
        {
          function: 'LINEAR_GRADIENT',
          angle: 0,
          repeat: false,
          stops: [{ at: 0, color: 0x111111ff }],
        },
        {
          function: 'URL',
          image_url: 'https://example.com/overlay.png',
          stops: [],
          canvas_repeat: 'repeat',
        },
      ],
    });

    expect(paint.layers.length).toBe(2);
    expect(paint.layers[1]?.function).toBe('URL');
    expect(paint.layers[1]?.repeat).toBe(true);
  });

  test('maps URL canvas_repeat to repeat flag', () => {
    const paint = normalizeSevenTvPaint({
      id: 'url-paint',
      name: 'URL Paint',
      gradients: [
        {
          function: 'URL',
          image_url: 'https://cdn.7tv.app/paint/test.webp',
          canvas_repeat: 'repeat',
          repeat: false,
          stops: [],
        },
      ],
    });

    expect(pickFields(paint, ['function', 'image_url', 'repeat'])).toEqual({
      function: 'URL',
      image_url: 'https://cdn.7tv.app/paint/test.webp',
      repeat: true,
    });
  });
});
