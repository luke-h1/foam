import type { IndexedCollection } from '@app/services/ws/util/indexedCollection';
import type { PaintData, PaintShadow } from '@app/types/seventv/cosmetics';

import {
  DEFAULT_PAINT_DROP_SHADOW_MODE,
  getPaintDropShadows,
} from '../paintLayer';

const firstShadow: PaintShadow = {
  x_offset: 1,
  y_offset: 1,
  radius: 2,
  color: 255,
};

const secondShadow: PaintShadow = {
  x_offset: -1,
  y_offset: -1,
  radius: 4,
  color: 65535,
};

function toIndexed<T>(items: T[]): IndexedCollection<T> {
  const collection: IndexedCollection<T> = { length: items.length };
  items.forEach((item, index) => {
    collection[index] = item;
  });
  return collection;
}

function makePaint(shadows: PaintShadow[]): PaintData {
  return {
    id: 'paint-1',
    name: 'Test Paint',
    color: null,
    layers: { length: 0 },
    shadows: toIndexed(shadows),
    textStyle: null,
    function: 'LINEAR_GRADIENT',
    repeat: false,
    angle: 0,
    shape: 'circle',
    image_url: '',
    stops: { length: 0 },
  };
}

describe('getPaintDropShadows', () => {
  test('mode 0 renders no shadows', () => {
    const paint = makePaint([firstShadow, secondShadow]);

    expect(getPaintDropShadows(paint, 0)).toEqual<PaintShadow[]>([]);
  });

  test('mode 1 renders only the first shadow, matching the extension', () => {
    const paint = makePaint([firstShadow, secondShadow]);

    expect(getPaintDropShadows(paint, 1)).toEqual<PaintShadow[]>([firstShadow]);
  });

  test('mode 2 renders all shadows, matching the extension', () => {
    const paint = makePaint([firstShadow, secondShadow]);

    expect(getPaintDropShadows(paint, 2)).toEqual<PaintShadow[]>([
      firstShadow,
      secondShadow,
    ]);
  });

  test('defaults to rendering all shadows', () => {
    const paint = makePaint([firstShadow, secondShadow]);

    expect(DEFAULT_PAINT_DROP_SHADOW_MODE).toBe(2);
    expect(getPaintDropShadows(paint)).toEqual<PaintShadow[]>([
      firstShadow,
      secondShadow,
    ]);
  });
});
