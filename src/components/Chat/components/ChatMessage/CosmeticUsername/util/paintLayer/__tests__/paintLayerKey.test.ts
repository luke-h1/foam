import type { PaintLayerData } from '@app/types/seventv/cosmetics';

import { withPaintLayerKeys } from '../paintLayerKey';

function layer(
  overrides: Partial<PaintLayerData> = {},
): PaintLayerData {
  return {
    function: 'LINEAR_GRADIENT',
    stops: { length: 0 },
    angle: 90,
    shape: 'circle',
    repeat: false,
    image_url: '',
    canvas_repeat: 'unset',
    at: null,
    size: null,
    ...overrides,
  };
}

describe('withPaintLayerKeys', () => {
  test('assigns content keys and suffixes duplicate layers', () => {
    const layers = [
      layer({ angle: 45 }),
      layer({ angle: 90 }),
      layer({ angle: 45 }),
    ];

    const keyed = withPaintLayerKeys(layers);

    expect(keyed.map(entry => entry.key)).toEqual([
      keyed[0].key,
      keyed[1].key,
      `${keyed[0].key}#1`,
    ]);
    expect(keyed[0].key).not.toEqual(keyed[1].key);
    expect(keyed[0].key.includes('45')).toBe(true);
    expect(keyed[2].key.endsWith('#1')).toBe(true);
  });
});
