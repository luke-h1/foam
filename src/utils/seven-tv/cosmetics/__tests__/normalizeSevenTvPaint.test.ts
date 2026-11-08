// `shape` here mirrors the 7TV paint API field name, not a naming choice.
// oxlint-disable anti-slop/no-shape-in-symbol-names
import type { PaintData, PaintStop } from '@app/types/seven-tv/cosmetics';
import type { IndexedCollection } from '@app/utils/collection/indexedCollection';

import { normalizeSevenTvPaint } from '../normalizeSevenTvPaint';

describe('normalizeSevenTvPaint', () => {
  test('normalizes legacy flat paint fields', () => {
    const paint = normalizeSevenTvPaint({
      id: 'paint-v2',
      name: 'V2 Paint',
      color: 0xff_00_00_ff,
      function: 'LINEAR_GRADIENT',
      angle: 45,
      repeat: true,
      shape: 'circle',
      image_url: '',
      stops: {
        0: { at: 0, color: 0xff_00_00_ff },
        1: { at: 1, color: 0x00_00_ff_ff },
        length: 2,
      },
    });

    const { id, function: paintFunction, angle, repeat, stops } = paint;

    expect({ id, function: paintFunction, angle, repeat, stops }).toEqual<
      Pick<PaintData, 'angle' | 'function' | 'id' | 'repeat' | 'stops'>
    >({
      id: 'paint-v2',
      function: 'LINEAR_GRADIENT',
      angle: 45,
      repeat: true,
      stops: {
        0: { at: 0, color: 0xff_00_00_ff },
        1: { at: 1, color: 0x00_00_ff_ff },
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
            { at: 0, color: 0xff_ff_ff_ff },
            { at: 1, color: 0x00_00_00_ff },
          ],
        },
        {
          function: 'LINEAR_GRADIENT',
          angle: 90,
          repeat: false,
          stops: [{ at: 0, color: 0x12_34_56_78 }],
        },
      ],
    });

    expect(paint.function).toBe('RADIAL_GRADIENT');

    expect(paint.shape).toBe('ellipse');

    expect(paint.layers.length).toBe(2);

    expect(paint.layers[1]?.function).toBe('LINEAR_GRADIENT');

    expect(paint.stops).toEqual<IndexedCollection<PaintStop>>({
      0: { at: 0, color: 0xff_ff_ff_ff },
      1: { at: 1, color: 0x00_00_00_ff },
      length: 2,
    });
  });

  test('maps a URL layer canvas_repeat to the repeat flag', () => {
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
        {
          function: 'LINEAR_GRADIENT',
          angle: 0,
          repeat: false,
          stops: [{ at: 0, color: 0x11_11_11_ff }],
        },
        {
          function: 'URL',
          image_url: 'https://example.com/overlay.png',
          stops: [],
          canvas_repeat: 'repeat',
        },
      ],
    });

    const { function: paintFunction, image_url: imageUrl, repeat } = paint;

    expect({ function: paintFunction, image_url: imageUrl, repeat }).toEqual<
      Pick<PaintData, 'function' | 'image_url' | 'repeat'>
    >({
      function: 'URL',
      image_url: 'https://cdn.7tv.app/paint/test.webp',
      repeat: true,
    });

    expect(paint.layers[2]?.repeat).toBe(true);
  });

  test('resolves a zero id to the payload ref_id', () => {
    const paint = normalizeSevenTvPaint({
      id: '00000000000000000000000000',
      ref_id: 'real-paint-id',
      name: 'Paint',
    });

    expect(paint.id).toBe('real-paint-id');
  });

  test('gives layer image urls a scheme so native image loaders accept them', () => {
    const paint = normalizeSevenTvPaint({
      id: 'url-paint',
      name: 'URL Paint',
      gradients: [
        {
          function: 'URL',
          image_url: '//cdn.7tv.app/paint/p/layer/l/1x.webp',
          canvas_repeat: 'no-repeat',
          stops: [],
        },
      ],
    });

    expect(paint.image_url).toBe('https://cdn.7tv.app/paint/p/layer/l/1x.webp');
  });
});
