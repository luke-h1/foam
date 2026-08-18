// This file's shape usages are the 7TV paint API's PaintData/PaintLayerData.shape
// field (see types/seventv/cosmetics.ts), not a naming choice.
// oxlint-disable anti-slop/no-shape-in-symbol-names
import { storageService } from '@app/lib/storage';
import { sevenTvService } from '@app/services/seventv-service';
import {
  addBadge,
  addPaint,
  type CachedUserCosmetics,
  clearPaintBindings,
  clearUserCosmeticsCache,
  clearUserPaintFlagCache,
  fetchAndCacheUserCosmetics,
  hasUserPaint,
  removeBadge,
  removeUserBadge,
  removeUserCosmetics,
  removeUserPaint,
  setUserBadge,
  setUserPaint,
  syncCachedUserCosmeticsFromStore,
} from '@app/store/chat/actions/cosmetics';
import {
  clearEntitlementUserLinkState,
  rememberSevenTvUserTwitchLink,
} from '@app/store/chat/actions/cosmeticsLinks';
import { chatStore$ } from '@app/store/chat/observables/chatStore';
import type {
  PaintData,
  UserCosmeticsInfo,
} from '@app/types/seventv/cosmetics';
import type { SanitisedBadgeSet } from '@app/types/twitch/badge';

const PAINT_ID = 'paint-popular';
const BADGE_ID = 'badge-popular';

function buildPaint(): PaintData {
  return {
    id: PAINT_ID,
    name: 'Popular Paint',
    color: 0x00ff00ff,
    layers: { length: 0 },
    shadows: {
      0: { color: 0x000000ff, radius: 2, x_offset: 0, y_offset: 1 },
      length: 1,
    },
    textStyle: null,
    function: 'LINEAR_GRADIENT',
    repeat: false,
    angle: 90,
    shape: 'circle',
    image_url: '',
    stops: {
      0: { at: 0, color: 0x00ff00ff },
      1: { at: 1, color: 0x0000ffff },
      length: 2,
    },
  };
}

function buildBadge(): SanitisedBadgeSet {
  return {
    id: BADGE_ID,
    url: 'https://cdn.7tv.app/badge/badge-popular/4x.webp',
    type: '7TV Badge',
    title: 'Popular Badge',
    set: BADGE_ID,
    provider: '7tv',
  };
}

function resetStore() {
  jest.spyOn(storageService, 'getString').mockReturnValue(null);
  jest.spyOn(storageService, 'set').mockImplementation(() => {});
  jest.spyOn(storageService, 'delete').mockImplementation(() => {});
  jest.spyOn(storageService, 'clearNamespace').mockImplementation(() => {});
  jest.spyOn(sevenTvService, 'getUserCosmeticsGql').mockResolvedValue(null);

  // Also drops pending debounced snapshot syncs, so wearer writes cannot
  // leak into the next test's storage counts.
  clearUserCosmeticsCache();
  chatStore$.paints.set({});
  chatStore$.badges.set({});
  chatStore$.userPaintIds.set({});
  chatStore$.userBadgeIds.set({});
  clearUserPaintFlagCache();
  chatStore$.cosmeticBindingsVersion.set(0);
  clearEntitlementUserLinkState();
  jest.mocked(storageService.set).mockClear();
}

function runEntitlementBurst(userCount: number): void {
  for (let index = 0; index < userCount; index += 1) {
    const ttvUserId = `ttv-user-${index}`;
    const sevenTvUserId = `stv-user-${index}`;
    rememberSevenTvUserTwitchLink(sevenTvUserId, ttvUserId);
    addPaint(buildPaint());
    addBadge(buildBadge());
    setUserPaint(ttvUserId, PAINT_ID);
    setUserBadge(ttvUserId, BADGE_ID);
  }
}

describe('cosmetics entitlement-burst churn', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    resetStore();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  test('a 100-wearer burst writes each wearer cache entry exactly once after the debounce', () => {
    runEntitlementBurst(100);

    expect(jest.mocked(storageService.set)).not.toHaveBeenCalled();

    jest.advanceTimersByTime(1000);

    expect(jest.mocked(storageService.set).mock.calls).toHaveLength(100);
  });

  test('binding changes for users without a 7TV link write no wearer snapshot', () => {
    setUserPaint('ttv-unlinked', PAINT_ID);

    jest.advanceTimersByTime(1000);

    expect(jest.mocked(storageService.set)).not.toHaveBeenCalled();
  });

  test('clearing a linked wearer rewrites their snapshot without cosmetics before any timer advance', () => {
    rememberSevenTvUserTwitchLink('stv-user-0', 'ttv-user-0');
    addBadge(buildBadge());
    setUserBadge('ttv-user-0', BADGE_ID);
    jest.advanceTimersByTime(1000);
    jest.mocked(storageService.set).mockClear();

    removeUserBadge('ttv-user-0');

    const expectedCosmetics: CachedUserCosmetics = {
      badgeId: null,
      expiresAt: Date.now() + 30 * 60 * 1000,
      paintId: null,
      ttvUserId: 'ttv-user-0',
    };
    expect(jest.mocked(storageService.set).mock.calls).toEqual([
      [
        'sevenTvUserCosmetics_user-cosmetics:stv-user-0',
        expectedCosmetics,
        'seven_tv_cache',
        { expiry: new Date(expectedCosmetics.expiresAt) },
      ],
    ]);
  });

  test('a removal inside the set debounce window flushes the wearer exactly once, with the cosmetic gone', () => {
    rememberSevenTvUserTwitchLink('stv-user-0', 'ttv-user-0');
    addBadge(buildBadge());
    setUserBadge('ttv-user-0', BADGE_ID);

    removeUserBadge('ttv-user-0');

    const expectedCosmetics: CachedUserCosmetics = {
      badgeId: null,
      expiresAt: Date.now() + 30 * 60 * 1000,
      paintId: null,
      ttvUserId: 'ttv-user-0',
    };
    expect(jest.mocked(storageService.set).mock.calls).toEqual([
      [
        'sevenTvUserCosmetics_user-cosmetics:stv-user-0',
        expectedCosmetics,
        'seven_tv_cache',
        { expiry: new Date(expectedCosmetics.expiresAt) },
      ],
    ]);

    jest.advanceTimersByTime(1000);

    expect(jest.mocked(storageService.set).mock.calls).toHaveLength(1);
  });

  test('a no-op removal for a linked wearer writes nothing', () => {
    rememberSevenTvUserTwitchLink('stv-user-0', 'ttv-user-0');

    removeUserBadge('ttv-user-0');
    removeUserPaint('ttv-user-0');
    jest.advanceTimersByTime(1000);

    expect(jest.mocked(storageService.set)).not.toHaveBeenCalled();
  });

  test('applying cached cosmetics rewrites no wearer snapshot', async () => {
    rememberSevenTvUserTwitchLink('stv-user-0', 'ttv-user-0');
    addPaint(buildPaint());
    addBadge(buildBadge());
    const cached: CachedUserCosmetics = {
      badgeId: BADGE_ID,
      expiresAt: Date.now() + 60 * 60 * 1000,
      paintId: PAINT_ID,
      ttvUserId: 'ttv-user-0',
    };
    jest.mocked(storageService.getString).mockReturnValueOnce(cached);

    await fetchAndCacheUserCosmetics('stv-user-0');
    jest.advanceTimersByTime(1000);

    expect(jest.mocked(storageService.set)).not.toHaveBeenCalled();
  });

  test('a genuine entitlement write after a cached apply still schedules the snapshot sync', async () => {
    rememberSevenTvUserTwitchLink('stv-user-0', 'ttv-user-0');
    addPaint(buildPaint());
    addBadge(buildBadge());
    const cached: CachedUserCosmetics = {
      badgeId: BADGE_ID,
      expiresAt: Date.now() + 60 * 60 * 1000,
      paintId: PAINT_ID,
      ttvUserId: 'ttv-user-0',
    };
    jest.mocked(storageService.getString).mockReturnValueOnce(cached);
    await fetchAndCacheUserCosmetics('stv-user-0');

    setUserPaint('ttv-user-0', 'paint-other');
    jest.advanceTimersByTime(1000);

    expect(jest.mocked(storageService.set).mock.calls).toHaveLength(1);
  });

  test('a definitive null fetch also drops a pending debounced snapshot for the wearer', async () => {
    rememberSevenTvUserTwitchLink('stv-user-0', 'ttv-user-0');
    addBadge(buildBadge());
    setUserBadge('ttv-user-0', BADGE_ID);
    jest.mocked(storageService.set).mockClear();

    const unresolvable: CachedUserCosmetics = {
      badgeId: 'badge-swept',
      expiresAt: Date.now() + 60_000,
      paintId: null,
      ttvUserId: 'ttv-user-0',
    };
    jest.mocked(storageService.getString).mockReturnValueOnce(unresolvable);
    jest.mocked(sevenTvService.getUserCosmeticsGql).mockResolvedValueOnce(null);

    await fetchAndCacheUserCosmetics('stv-user-0');
    jest.advanceTimersByTime(1000);

    expect(jest.mocked(storageService.delete)).toHaveBeenCalledWith(
      'sevenTvUserCosmetics_user-cosmetics:stv-user-0',
      'seven_tv_cache',
    );
    expect(jest.mocked(storageService.set)).not.toHaveBeenCalled();
  });

  test('an entitlement reset removal writes the wearer snapshot once, with both cosmetics gone', () => {
    rememberSevenTvUserTwitchLink('stv-user-0', 'ttv-user-0');
    addPaint(buildPaint());
    addBadge(buildBadge());
    setUserPaint('ttv-user-0', PAINT_ID);
    setUserBadge('ttv-user-0', BADGE_ID);
    jest.advanceTimersByTime(1000);
    jest.mocked(storageService.set).mockClear();

    removeUserCosmetics('ttv-user-0');

    const expectedCosmetics: CachedUserCosmetics = {
      badgeId: null,
      expiresAt: Date.now() + 30 * 60 * 1000,
      paintId: null,
      ttvUserId: 'ttv-user-0',
    };
    expect(jest.mocked(storageService.set).mock.calls).toEqual([
      [
        'sevenTvUserCosmetics_user-cosmetics:stv-user-0',
        expectedCosmetics,
        'seven_tv_cache',
        { expiry: new Date(expectedCosmetics.expiresAt) },
      ],
    ]);

    jest.advanceTimersByTime(1000);

    expect(jest.mocked(storageService.set).mock.calls).toHaveLength(1);
  });

  test('an entitlement reset removal for a wearer without bindings writes nothing', () => {
    rememberSevenTvUserTwitchLink('stv-user-0', 'ttv-user-0');

    removeUserCosmetics('ttv-user-0');
    jest.advanceTimersByTime(1000);

    expect(jest.mocked(storageService.set)).not.toHaveBeenCalled();
  });

  test('a bindings clear inside the debounce window flushes the wearer from the pre-clear bindings', () => {
    rememberSevenTvUserTwitchLink('stv-user-0', 'ttv-user-0');
    addPaint(buildPaint());
    setUserPaint('ttv-user-0', PAINT_ID);

    clearPaintBindings();

    const expectedCosmetics: CachedUserCosmetics = {
      badgeId: null,
      expiresAt: Date.now() + 2 * 60 * 60 * 1000,
      paintId: PAINT_ID,
      ttvUserId: 'ttv-user-0',
    };
    expect(jest.mocked(storageService.set).mock.calls).toEqual([
      [
        'sevenTvUserCosmetics_user-cosmetics:stv-user-0',
        expectedCosmetics,
        'seven_tv_cache',
        { expiry: new Date(expectedCosmetics.expiresAt) },
      ],
    ]);

    jest.advanceTimersByTime(1000);

    expect(jest.mocked(storageService.set).mock.calls).toHaveLength(1);
  });

  test('re-adding an equal paint definition keeps the stored object identity', () => {
    addPaint(buildPaint());
    const stored = chatStore$.paints[PAINT_ID]?.peek();

    addPaint(buildPaint());

    expect(chatStore$.paints[PAINT_ID]?.peek()).toBe(stored);
  });

  test('re-adding an equal badge definition keeps the stored object identity', () => {
    addBadge(buildBadge());
    const stored = chatStore$.badges[BADGE_ID]?.peek();

    addBadge(buildBadge());

    expect(chatStore$.badges[BADGE_ID]?.peek()).toBe(stored);
  });

  test('a changed paint definition still replaces the stored paint', () => {
    addPaint(buildPaint());

    const recolored: PaintData = { ...buildPaint(), color: 0xff0000ff };
    addPaint(recolored);

    expect(chatStore$.paints[PAINT_ID]?.peek()).toEqual<PaintData>(recolored);
  });

  test('a 100-wearer burst causes at most one reprocess restart, from badges only', () => {
    runEntitlementBurst(100);

    expect(chatStore$.cosmeticBindingsVersion.peek()).toEqual(0);

    jest.advanceTimersByTime(1000);

    expect(chatStore$.cosmeticBindingsVersion.peek()).toEqual(1);
  });

  test('badge bindings arriving after a quiet window schedule a fresh bump', () => {
    setUserBadge('ttv-user-early', BADGE_ID);
    jest.advanceTimersByTime(1000);

    expect(chatStore$.cosmeticBindingsVersion.peek()).toEqual(1);

    setUserBadge('ttv-user-late', BADGE_ID);
    jest.advanceTimersByTime(1000);

    expect(chatStore$.cosmeticBindingsVersion.peek()).toEqual(2);
  });

  test('paint bindings never bump the reprocess version', () => {
    setUserPaint('ttv-user-0', PAINT_ID);
    setUserPaint('ttv-user-0', 'paint-other');
    jest.advanceTimersByTime(1000);

    expect(chatStore$.cosmeticBindingsVersion.peek()).toEqual(0);
  });

  test('removing a badge definition schedules a bindings bump for baked rows', () => {
    addBadge(buildBadge());
    setUserBadge('ttv-user-0', BADGE_ID);
    jest.advanceTimersByTime(1000);
    expect(chatStore$.cosmeticBindingsVersion.peek()).toEqual(1);

    removeBadge(BADGE_ID);
    jest.advanceTimersByTime(1000);

    expect(chatStore$.cosmeticBindingsVersion.peek()).toEqual(2);
    expect(chatStore$.badges.peek()).toEqual({});
    expect(chatStore$.userBadgeIds.peek()).toEqual({});
  });

  test('an id-only snapshot with held definitions applies without a refetch', async () => {
    addPaint(buildPaint());
    addBadge(buildBadge());
    const stored: CachedUserCosmetics = {
      badgeId: BADGE_ID,
      expiresAt: Date.now() + 60_000,
      paintId: PAINT_ID,
      ttvUserId: 'ttv-hit',
    };
    jest.mocked(storageService.getString).mockReturnValueOnce(stored);

    const result = await fetchAndCacheUserCosmetics('stv-id-only-hit');

    expect(result).toBe('ttv-hit');
    expect(sevenTvService.getUserCosmeticsGql).not.toHaveBeenCalled();
    expect(chatStore$.userPaintIds.peek()['ttv-hit']).toBe(PAINT_ID);
    expect(chatStore$.userBadgeIds.peek()['ttv-hit']).toBe(BADGE_ID);
  });

  test('adding a badge past the definition cap sweeps unreferenced definitions', () => {
    for (let index = 0; index < 750; index += 1) {
      addBadge({
        ...buildBadge(),
        id: `badge-${index}`,
        set: `badge-${index}`,
      });
    }
    setUserBadge('ttv-user-0', 'badge-0');

    addBadge({ ...buildBadge(), id: 'badge-750', set: 'badge-750' });

    expect(Object.keys(chatStore$.badges.peek())).toEqual([
      'badge-0',
      'badge-750',
    ]);
  });

  test('hasUserPaint memoises per user and invalidates on a binding change', () => {
    addPaint(buildPaint());
    setUserPaint('ttv-user-0', PAINT_ID);

    expect(hasUserPaint('ttv-user-0')).toBe(true);

    removeUserPaint('ttv-user-0');

    expect(hasUserPaint('ttv-user-0')).toBe(false);
  });

  test('a snapshot whose bound ids no longer resolve is treated as a miss', async () => {
    const stored: CachedUserCosmetics = {
      badgeId: null,
      expiresAt: Date.now() + 60_000,
      paintId: PAINT_ID,
      ttvUserId: 'ttv-stale',
    };
    jest.mocked(storageService.getString).mockReturnValueOnce(stored);
    jest.mocked(sevenTvService.getUserCosmeticsGql).mockResolvedValue(null);

    await fetchAndCacheUserCosmetics('stv-unresolvable');

    expect(sevenTvService.getUserCosmeticsGql).toHaveBeenCalledWith(
      'stv-unresolvable',
    );
  });

  test('an unresolvable snapshot whose refetch returns null is deleted', async () => {
    const stored: CachedUserCosmetics = {
      badgeId: 'badge-vanished',
      expiresAt: Date.now() + 60_000,
      paintId: null,
      ttvUserId: 'ttv-dead',
    };
    jest.mocked(storageService.getString).mockReturnValueOnce(stored);
    jest.mocked(sevenTvService.getUserCosmeticsGql).mockResolvedValue(null);
    jest.mocked(sevenTvService.getUserCosmeticsGql).mockClear();
    jest.mocked(storageService.delete).mockClear();

    const result = await fetchAndCacheUserCosmetics('stv-dead');
    await fetchAndCacheUserCosmetics('stv-dead');

    expect(result).toBeNull();
    expect(jest.mocked(storageService.delete).mock.calls).toEqual([
      ['sevenTvUserCosmetics_user-cosmetics:stv-dead', 'seven_tv_cache'],
    ]);
    expect(jest.mocked(sevenTvService.getUserCosmeticsGql).mock.calls).toEqual([
      ['stv-dead'],
      ['stv-dead'],
    ]);
  });

  test('a network error keeps the stored snapshot for a later retry', async () => {
    const stored: CachedUserCosmetics = {
      badgeId: 'badge-offline',
      expiresAt: Date.now() + 60_000,
      paintId: null,
      ttvUserId: 'ttv-offline',
    };
    jest.mocked(storageService.getString).mockReturnValueOnce(stored);
    jest.mocked(storageService.delete).mockClear();
    jest
      .mocked(sevenTvService.getUserCosmeticsGql)
      .mockRejectedValueOnce(new Error('network down'));

    const result = await fetchAndCacheUserCosmetics('stv-offline');

    expect(result).toBeNull();
    expect(storageService.delete).not.toHaveBeenCalled();
  });

  test('an unresolvable snapshot heals when the refetch succeeds', async () => {
    const stored: CachedUserCosmetics = {
      badgeId: 'badge-heal',
      expiresAt: Date.now() + 60_000,
      paintId: null,
      ttvUserId: 'ttv-heal',
    };
    jest.mocked(storageService.getString).mockReturnValueOnce(stored);
    jest.mocked(storageService.delete).mockClear();
    jest.mocked(sevenTvService.getUserCosmeticsGql).mockResolvedValueOnce({
      userId: 'stv-heal',
      ttvUserId: 'ttv-heal',
      paintId: null,
      badgeId: 'badge-heal',
      paint: null,
      badge: {
        id: 'badge-heal',
        name: 'Heal Badge',
        description: null,
        images: [
          {
            url: 'https://cdn.7tv.app/badge/badge-heal/4x.webp',
            mime: 'image/webp',
            size: 1,
            scale: 4,
            width: 18,
            height: 18,
            frameCount: 1,
          },
        ],
      },
    } satisfies UserCosmeticsInfo);

    const result = await fetchAndCacheUserCosmetics('stv-heal');

    expect(result).toBe('ttv-heal');
    expect(chatStore$.userBadgeIds.peek()['ttv-heal']).toBe('badge-heal');
    expect(Object.keys(chatStore$.badges.peek())).toEqual(['badge-heal']);
    expect(jest.mocked(storageService.delete)).not.toHaveBeenCalled();
  });

  test('a resolvable old embedded-shape snapshot still serves as a hit', async () => {
    addPaint(buildPaint());
    addBadge(buildBadge());
    const stored: CachedUserCosmetics & {
      badge: SanitisedBadgeSet;
      paint: PaintData;
    } = {
      badge: buildBadge(),
      badgeId: BADGE_ID,
      expiresAt: Date.now() + 60_000,
      paint: buildPaint(),
      paintId: PAINT_ID,
      ttvUserId: 'ttv-embedded',
    };
    jest.mocked(storageService.getString).mockReturnValueOnce(stored);
    jest.mocked(sevenTvService.getUserCosmeticsGql).mockClear();

    const result = await fetchAndCacheUserCosmetics('stv-embedded');

    expect(result).toBe('ttv-embedded');
    expect(sevenTvService.getUserCosmeticsGql).not.toHaveBeenCalled();
    expect(chatStore$.userPaintIds.peek()['ttv-embedded']).toBe(PAINT_ID);
    expect(chatStore$.userBadgeIds.peek()['ttv-embedded']).toBe(BADGE_ID);
  });

  test('the badge sweep keeps ids referenced only by session cosmetic snapshots', () => {
    addBadge({ ...buildBadge(), id: 'badge-session', set: 'badge-session' });
    setUserBadge('ttv-session', 'badge-session');
    syncCachedUserCosmeticsFromStore('stv-session-ref', 'ttv-session');
    removeUserBadge('ttv-session');

    for (let index = 0; index < 749; index += 1) {
      addBadge({
        ...buildBadge(),
        id: `badge-${index}`,
        set: `badge-${index}`,
      });
    }
    addBadge({ ...buildBadge(), id: 'badge-new', set: 'badge-new' });

    expect(Object.keys(chatStore$.badges.peek())).toEqual([
      'badge-session',
      'badge-new',
    ]);
  });

  test('the paint sweep keeps ids referenced only by session cosmetic snapshots', () => {
    addPaint({ ...buildPaint(), id: 'paint-session' });
    setUserPaint('ttv-paint-session', 'paint-session');
    syncCachedUserCosmeticsFromStore(
      'stv-paint-session-ref',
      'ttv-paint-session',
    );
    removeUserPaint('ttv-paint-session');

    for (let index = 0; index < 749; index += 1) {
      addPaint({ ...buildPaint(), id: `paint-${index}` });
    }
    addPaint({ ...buildPaint(), id: 'paint-new' });

    expect(Object.keys(chatStore$.paints.peek())).toEqual([
      'paint-session',
      'paint-new',
    ]);
  });
});
