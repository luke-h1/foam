import {
  cachePaintBitmaps,
  clearPaintBitmapCache,
  type DisposablePaintBitmaps,
  getCachedPaintBitmaps,
  MAX_CACHED_PAINT_BITMAPS,
  releasePaintBitmaps,
  retainPaintBitmaps,
} from '@app/utils/image/paintBitmapCacheLifecycle';

interface FakeEntry extends DisposablePaintBitmaps {
  staticImage: { dispose: jest.Mock };
  maskImage: { dispose: jest.Mock };
  backingImage: { dispose: jest.Mock };
  strokeImage: { dispose: jest.Mock };
  layerSlots: { kind: 'baked'; image: { dispose: jest.Mock } }[];
}

function createEntry({ bakedLayers = 0 }: { bakedLayers?: number } = {}) {
  return {
    staticImage: { dispose: jest.fn() },
    maskImage: { dispose: jest.fn() },
    backingImage: { dispose: jest.fn() },
    strokeImage: { dispose: jest.fn() },
    layerSlots: Array.from({ length: bakedLayers }, () => ({
      kind: 'baked' as const,
      image: { dispose: jest.fn() },
    })),
  } satisfies FakeEntry;
}

function disposeCallCounts(entry: FakeEntry) {
  return {
    staticImage: entry.staticImage.dispose.mock.calls.length,
    maskImage: entry.maskImage.dispose.mock.calls.length,
    backingImage: entry.backingImage.dispose.mock.calls.length,
    strokeImage: entry.strokeImage.dispose.mock.calls.length,
    bakedLayers: entry.layerSlots.map(
      slot => slot.image.dispose.mock.calls.length,
    ),
  };
}

let frameCallbacks: FrameRequestCallback[] = [];

/**
 * Disposal is deferred two frames, so drain twice.
 */
function flushFrames(): void {
  for (let frame = 0; frame < 2; frame += 1) {
    const pending = frameCallbacks;
    frameCallbacks = [];
    pending.forEach(callback => callback(0));
  }
}

beforeEach(() => {
  frameCallbacks = [];
  jest
    .spyOn(globalThis, 'requestAnimationFrame')
    .mockImplementation(callback => frameCallbacks.push(callback));
});

afterEach(() => {
  clearPaintBitmapCache();
  flushFrames();
  jest.restoreAllMocks();
});

describe('paintBitmapCacheLifecycle', () => {
  test('disposes every texture an evicted entry owns', () => {
    const evicted = createEntry({ bakedLayers: 2 });
    cachePaintBitmaps('evicted', evicted);

    for (let index = 0; index < MAX_CACHED_PAINT_BITMAPS; index += 1) {
      cachePaintBitmaps(`filler-${index}`, createEntry());
    }
    flushFrames();

    expect(disposeCallCounts(evicted)).toEqual({
      staticImage: 1,
      maskImage: 1,
      backingImage: 1,
      strokeImage: 1,
      bakedLayers: [1, 1],
    });
  });

  test('does not dispose an entry a mounted canvas still retains', () => {
    const retained = createEntry({ bakedLayers: 1 });
    cachePaintBitmaps('retained', retained);
    retainPaintBitmaps(retained);

    for (let index = 0; index < MAX_CACHED_PAINT_BITMAPS; index += 1) {
      cachePaintBitmaps(`filler-${index}`, createEntry());
    }
    flushFrames();

    expect(disposeCallCounts(retained)).toEqual({
      staticImage: 0,
      maskImage: 0,
      backingImage: 0,
      strokeImage: 0,
      bakedLayers: [0],
    });
  });

  test('disposes a retained entry once the last canvas releases it', () => {
    const retained = createEntry({ bakedLayers: 1 });
    cachePaintBitmaps('retained', retained);
    retainPaintBitmaps(retained);
    retainPaintBitmaps(retained);

    for (let index = 0; index < MAX_CACHED_PAINT_BITMAPS; index += 1) {
      cachePaintBitmaps(`filler-${index}`, createEntry());
    }
    flushFrames();

    releasePaintBitmaps(retained);

    expect(disposeCallCounts(retained)).toEqual({
      staticImage: 0,
      maskImage: 0,
      backingImage: 0,
      strokeImage: 0,
      bakedLayers: [0],
    });

    releasePaintBitmaps(retained);

    expect(disposeCallCounts(retained)).toEqual({
      staticImage: 1,
      maskImage: 1,
      backingImage: 1,
      strokeImage: 1,
      bakedLayers: [1],
    });
  });

  test('leaves a released entry alone while it is still cached', () => {
    const cached = createEntry();
    cachePaintBitmaps('cached', cached);

    retainPaintBitmaps(cached);
    releasePaintBitmaps(cached);
    flushFrames();

    expect(disposeCallCounts(cached)).toEqual({
      staticImage: 0,
      maskImage: 0,
      backingImage: 0,
      strokeImage: 0,
      bakedLayers: [],
    });
    expect(getCachedPaintBitmaps('cached')).toBe(cached);
  });

  test('a cache hit refreshes recency so the entry survives eviction', () => {
    const hit = createEntry();
    cachePaintBitmaps('hit', hit);
    cachePaintBitmaps('cold', createEntry());

    expect(getCachedPaintBitmaps('hit')).toBe(hit);

    for (let index = 0; index < MAX_CACHED_PAINT_BITMAPS - 1; index += 1) {
      cachePaintBitmaps(`filler-${index}`, createEntry());
    }
    flushFrames();

    expect(getCachedPaintBitmaps('cold')).toBeUndefined();
    expect(getCachedPaintBitmaps('hit')).toBe(hit);
  });

  test('clearing disposes cached entries and drops them from the cache', () => {
    const cleared = createEntry({ bakedLayers: 1 });
    cachePaintBitmaps('cleared', cleared);

    clearPaintBitmapCache();
    flushFrames();

    expect(disposeCallCounts(cleared)).toEqual({
      staticImage: 1,
      maskImage: 1,
      backingImage: 1,
      strokeImage: 1,
      bakedLayers: [1],
    });
    expect(getCachedPaintBitmaps('cleared')).toBeUndefined();
  });

  test('clearing spares an on-screen entry until it is released', () => {
    const onScreen = createEntry();
    cachePaintBitmaps('on-screen', onScreen);
    retainPaintBitmaps(onScreen);

    clearPaintBitmapCache();
    flushFrames();

    expect(disposeCallCounts(onScreen)).toEqual({
      staticImage: 0,
      maskImage: 0,
      backingImage: 0,
      strokeImage: 0,
      bakedLayers: [],
    });

    releasePaintBitmaps(onScreen);

    expect(disposeCallCounts(onScreen)).toEqual({
      staticImage: 1,
      maskImage: 1,
      backingImage: 1,
      strokeImage: 1,
      bakedLayers: [],
    });
  });

  test('refuses a retain on an entry whose textures are already gone', () => {
    const disposed = createEntry();
    cachePaintBitmaps('disposed', disposed);

    clearPaintBitmapCache();
    flushFrames();

    // The canvas lost the race: its commit landed after disposal ran, so it
    // must rebuild rather than draw a dead texture.
    expect(retainPaintBitmaps(disposed)).toBe(false);

    // A refused retain must not resurrect the entry into the retain table, or
    // a later release would dispose it a second time.
    releasePaintBitmaps(disposed);
    expect(disposeCallCounts(disposed)).toEqual({
      staticImage: 1,
      maskImage: 1,
      backingImage: 1,
      strokeImage: 1,
      bakedLayers: [],
    });
  });

  test('accepts a retain on a live entry', () => {
    const live = createEntry();
    cachePaintBitmaps('live', live);

    expect(retainPaintBitmaps(live)).toBe(true);

    releasePaintBitmaps(live);
  });

  test('a canvas that mounts after eviction keeps the entry alive', () => {
    const evicted = createEntry();
    cachePaintBitmaps('evicted', evicted);

    for (let index = 0; index < MAX_CACHED_PAINT_BITMAPS; index += 1) {
      cachePaintBitmaps(`filler-${index}`, createEntry());
    }

    // The retaining effect lands before the deferred flush runs.
    retainPaintBitmaps(evicted);
    flushFrames();

    expect(disposeCallCounts(evicted)).toEqual({
      staticImage: 0,
      maskImage: 0,
      backingImage: 0,
      strokeImage: 0,
      bakedLayers: [],
    });

    releasePaintBitmaps(evicted);

    expect(disposeCallCounts(evicted)).toEqual({
      staticImage: 1,
      maskImage: 1,
      backingImage: 1,
      strokeImage: 1,
      bakedLayers: [],
    });
  });
});
