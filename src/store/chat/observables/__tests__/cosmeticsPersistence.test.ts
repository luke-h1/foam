import type { PaintData } from '@app/store/chat/types/constants';

import {
  type CosmeticsSnapshot,
  loadPersistedCosmetics,
  writePersistedCosmeticBindings,
  writePersistedCosmeticDefinitions,
} from '../cosmeticsPersistence';

const mockBackingStore = new Map<string, unknown>();

jest.mock('@app/lib/storage', () => ({
  storageService: {
    getString: jest.fn((key: string) => mockBackingStore.get(key) ?? null),
    set: jest.fn((key: string, value: unknown) => {
      mockBackingStore.set(key, value);
    }),
  },
}));

const makePaint = (id: string): PaintData => ({
  id,
  name: id,
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
});

describe('cosmeticsPersistence', () => {
  beforeEach(() => {
    mockBackingStore.clear();
    jest.clearAllMocks();
  });

  test('returns null when nothing is cached', () => {
    expect(loadPersistedCosmetics()).toBeNull();
  });

  test('round-trips paints and entitlements across the split keys', () => {
    writePersistedCosmeticDefinitions({
      paints: { 'paint-1': makePaint('paint-1') },
      badges: {},
    });
    writePersistedCosmeticBindings({
      userPaintIds: { 'user-1': 'paint-1' },
      userBadgeIds: { 'user-1': 'badge-1' },
    });

    const loaded = loadPersistedCosmetics();

    expect(loaded?.paints['paint-1']).toEqual(makePaint('paint-1'));
    expect(loaded?.userPaintIds).toEqual({ 'user-1': 'paint-1' });
    expect(loaded?.userBadgeIds).toEqual({ 'user-1': 'badge-1' });
  });

  test('loads bindings alone when definitions were never written', () => {
    writePersistedCosmeticBindings({
      userPaintIds: { 'user-1': 'paint-1' },
      userBadgeIds: {},
    });

    expect(loadPersistedCosmetics()).toEqual<CosmeticsSnapshot>({
      paints: {},
      badges: {},
      userPaintIds: { 'user-1': 'paint-1' },
      userBadgeIds: {},
    });
  });

  test('falls back to the legacy combined snapshot key', () => {
    mockBackingStore.set('sevenTvCosmeticsSnapshot_v1', {
      paints: { 'paint-1': makePaint('paint-1') },
      badges: {},
      userPaintIds: { 'user-1': 'paint-1' },
      userBadgeIds: {},
    });

    expect(loadPersistedCosmetics()).toEqual<CosmeticsSnapshot>({
      paints: { 'paint-1': makePaint('paint-1') },
      badges: {},
      userPaintIds: { 'user-1': 'paint-1' },
      userBadgeIds: {},
    });
  });

  test('fills missing bindings from the legacy snapshot when only definitions were split-written', () => {
    mockBackingStore.set('sevenTvCosmeticsSnapshot_v1', {
      paints: { 'paint-legacy': makePaint('paint-legacy') },
      badges: {},
      userPaintIds: { 'user-1': 'paint-legacy' },
      userBadgeIds: { 'user-1': 'badge-1' },
    });
    writePersistedCosmeticDefinitions({
      paints: { 'paint-1': makePaint('paint-1') },
      badges: {},
    });

    expect(loadPersistedCosmetics()).toEqual<CosmeticsSnapshot>({
      paints: { 'paint-1': makePaint('paint-1') },
      badges: {},
      userPaintIds: { 'user-1': 'paint-legacy' },
      userBadgeIds: { 'user-1': 'badge-1' },
    });
  });

  test('fills missing definitions from the legacy snapshot when only bindings were split-written', () => {
    mockBackingStore.set('sevenTvCosmeticsSnapshot_v1', {
      paints: { 'paint-legacy': makePaint('paint-legacy') },
      badges: {},
      userPaintIds: { 'user-1': 'paint-legacy' },
      userBadgeIds: {},
    });
    writePersistedCosmeticBindings({
      userPaintIds: { 'user-2': 'paint-legacy' },
      userBadgeIds: {},
    });

    expect(loadPersistedCosmetics()).toEqual<CosmeticsSnapshot>({
      paints: { 'paint-legacy': makePaint('paint-legacy') },
      badges: {},
      userPaintIds: { 'user-2': 'paint-legacy' },
      userBadgeIds: {},
    });
  });

  test('caps the persisted paint map to the most recent entries', () => {
    const paints: Record<string, PaintData> = {};
    for (let i = 0; i < 800; i += 1) {
      paints[`paint-${i}`] = makePaint(`paint-${i}`);
    }

    writePersistedCosmeticDefinitions({ paints, badges: {} });

    const loaded = loadPersistedCosmetics();
    const ids = Object.keys(loaded?.paints ?? {});

    expect(ids).toHaveLength(750);
    // Oldest dropped, newest kept (insertion order).
    expect(loaded?.paints['paint-0']).toBeUndefined();
    expect(loaded?.paints['paint-799']).toEqual(makePaint('paint-799'));
  });
});
