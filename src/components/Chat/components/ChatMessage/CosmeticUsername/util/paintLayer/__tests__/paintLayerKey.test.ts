import type { PaintLayerData } from '@app/types/seventv/cosmetics';

import { withPaintLayerKeys } from '../paintLayerKey';

function layer(overrides: Partial<PaintLayerData> = {}): PaintLayerData {
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
    const keys = keyed.map(entry => entry.key);

    expect(keys).toHaveLength(3);
    const [first, second, third] = keys as [string, string, string];

    expect(keys).toEqual([first, second, `${first}#1`]);
    expect(first).not.toEqual(second);
    expect(first.includes('45')).toBe(true);
    expect(third.endsWith('#1')).toBe(true);
  });
});
