import type { IndexedCollection } from '@app/services/ws/util/indexedCollection';
import type {
  PaintData,
  PaintShadow,
  PaintStop,
} from '@app/types/seventv/cosmetics';

import { toPaintWithId } from '../toPaintWithId';

const emptyShadows: IndexedCollection<PaintShadow> = { length: 0 };
const emptyStops: IndexedCollection<PaintStop> = { length: 0 };

function makePaintData(overrides: {
  id: string;
  name: string;
  color: number | null;
  ref_id?: string;
}): PaintData & { ref_id?: string } {
  return {
    id: overrides.id,
    name: overrides.name,
    color: overrides.color,
    layers: { length: 0 },
    shadows: emptyShadows,
    textStyle: null,
    function: 'LINEAR_GRADIENT',
    repeat: false,
    angle: 0,
    shape: 'circle',
    image_url: '',
    stops: emptyStops,
    ...(overrides.ref_id !== undefined && { ref_id: overrides.ref_id }),
  };
}

describe('toPaintWithId', () => {
  test('returns normalized paint with same id when not zero', () => {
    const paint = makePaintData({
      id: 'paint-123',
      name: 'Paint',
      color: 0xff0000ff,
    });
    expect(toPaintWithId(paint).id).toBe('paint-123');
    expect(toPaintWithId(paint).name).toBe('Paint');
  });

  test('returns paint with ref_id when id is zero', () => {
    const zeroId = '00000000000000000000000000';
    const paint = makePaintData({
      id: zeroId,
      ref_id: 'real-paint-id',
      name: 'Paint',
      color: 0x00ff00ff,
    });
    expect(toPaintWithId(paint).id).toBe('real-paint-id');
  });
});
