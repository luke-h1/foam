import { makePaint } from '@app/components/chat/components/chat-message/cosmetic-username/util/paint-css/__fixtures__/paintCss.fixture';
import { storageService } from '@app/lib/storage';
import type { PaintData } from '@app/types/seven-tv/cosmetics';

import {
  type CosmeticsSnapshot,
  loadPersistedCosmetics,
  writePersistedCosmeticBindings,
  writePersistedCosmeticDefinitions,
} from '../cosmetics-persistence';

const LEGACY_COSMETICS_SNAPSHOT_KEY = 'sevenTvCosmeticsSnapshot_v1';
const COSMETICS_NAMESPACE = 'seven_tv_cache';

const setLegacySnapshot = (snapshot: CosmeticsSnapshot): void => {
  storageService.set(
    LEGACY_COSMETICS_SNAPSHOT_KEY,
    snapshot,
    COSMETICS_NAMESPACE,
  );
};

const makePaintWithId = (id: string): PaintData => makePaint({ id, name: id });

describe('cosmeticsPersistence', () => {
  beforeEach(() => {
    storageService.clear();
  });

  test('returns null when nothing is cached', () => {
    expect(loadPersistedCosmetics()).toBeNull();
  });

  test('round-trips paints and entitlements across the split keys', () => {
    writePersistedCosmeticDefinitions({
      paints: { 'paint-1': makePaintWithId('paint-1') },
      badges: {},
    });

    writePersistedCosmeticBindings({
      userPaintIds: { 'user-1': 'paint-1' },
      userBadgeIds: { 'user-1': 'badge-1' },
    });

    const loaded = loadPersistedCosmetics();

    expect(loaded?.paints['paint-1']).toEqual(makePaintWithId('paint-1'));

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
    setLegacySnapshot({
      paints: { 'paint-1': makePaintWithId('paint-1') },
      badges: {},
      userPaintIds: { 'user-1': 'paint-1' },
      userBadgeIds: {},
    });

    expect(loadPersistedCosmetics()).toEqual<CosmeticsSnapshot>({
      paints: { 'paint-1': makePaintWithId('paint-1') },
      badges: {},
      userPaintIds: { 'user-1': 'paint-1' },
      userBadgeIds: {},
    });
  });

  test('fills missing bindings from the legacy snapshot when only definitions were split-written', () => {
    setLegacySnapshot({
      paints: { 'paint-legacy': makePaintWithId('paint-legacy') },
      badges: {},
      userPaintIds: { 'user-1': 'paint-legacy' },
      userBadgeIds: { 'user-1': 'badge-1' },
    });

    writePersistedCosmeticDefinitions({
      paints: { 'paint-1': makePaintWithId('paint-1') },
      badges: {},
    });

    expect(loadPersistedCosmetics()).toEqual<CosmeticsSnapshot>({
      paints: { 'paint-1': makePaintWithId('paint-1') },
      badges: {},
      userPaintIds: { 'user-1': 'paint-legacy' },
      userBadgeIds: { 'user-1': 'badge-1' },
    });
  });

  test('fills missing definitions from the legacy snapshot when only bindings were split-written', () => {
    setLegacySnapshot({
      paints: { 'paint-legacy': makePaintWithId('paint-legacy') },
      badges: {},
      userPaintIds: { 'user-1': 'paint-legacy' },
      userBadgeIds: {},
    });

    writePersistedCosmeticBindings({
      userPaintIds: { 'user-2': 'paint-legacy' },
      userBadgeIds: {},
    });

    expect(loadPersistedCosmetics()).toEqual<CosmeticsSnapshot>({
      paints: { 'paint-legacy': makePaintWithId('paint-legacy') },
      badges: {},
      userPaintIds: { 'user-2': 'paint-legacy' },
      userBadgeIds: {},
    });
  });

  test('caps the persisted paint map to the most recent entries', () => {
    const paints: Record<string, PaintData> = {};

    for (let i = 0; i < 800; i += 1) {
      paints[`paint-${i}`] = makePaintWithId(`paint-${i}`);
    }

    writePersistedCosmeticDefinitions({ paints, badges: {} });

    const loaded = loadPersistedCosmetics();
    const ids = Object.keys(loaded?.paints ?? {});

    expect(ids).toHaveLength(750);

    // Oldest dropped, newest kept (insertion order).
    expect(loaded?.paints['paint-0']).toBeUndefined();

    expect(loaded?.paints['paint-799']).toEqual(makePaintWithId('paint-799'));
  });
});
