import type { IndexedCollection } from '@app/services/ws/util/indexedCollection';
import type { PaintData, PaintLayerData } from '@app/types/seventv/cosmetics';

// Packed 7TV colors: RRGGBBAA as a signed 32-bit integer.
export const RED = -16776961; // 0xFF0000FF
export const BLUE = 65535; // 0x0000FFFF
export const HALF_BLACK = 128; // 0x00000080

export function toIndexed<T>(items: T[]): IndexedCollection<T> {
  const collection: IndexedCollection<T> = { length: items.length };
  items.forEach((item, index) => {
    collection[index] = item;
  });
  return collection;
}

export function makeLayer(overrides: Partial<PaintLayerData>): PaintLayerData {
  return {
    function: 'LINEAR_GRADIENT',
    stops: { length: 0 },
    angle: 0,
    shape: 'circle',
    repeat: false,
    image_url: '',
    canvas_repeat: '',
    at: null,
    size: null,
    ...overrides,
  };
}

export function makePaint(overrides: Partial<PaintData>): PaintData {
  return {
    id: 'paint-1',
    name: 'Test Paint',
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
