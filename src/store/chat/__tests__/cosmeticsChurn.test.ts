import { storageService } from '@app/lib/storage';
import {
  addBadge,
  addPaint,
  type CachedUserCosmetics,
  clearUserCosmeticsCache,
  fetchAndCacheUserCosmetics,
  removeBadge,
  removeUserBadge,
  removeUserPaint,
  setUserBadge,
  setUserPaint,
} from '@app/store/chat/actions/cosmetics';
import {
  clearEntitlementUserLinkState,
  rememberSevenTvUserTwitchLink,
} from '@app/store/chat/actions/cosmeticsLinks';
import { chatStore$ } from '@app/store/chat/observables/chatStore';
import type { PaintData } from '@app/types/seventv/cosmetics';
import type { SanitisedBadgeSet } from '@app/types/twitch/badge';

jest.mock('@app/lib/storage', () => ({
  storageService: {
    getString: jest.fn(() => null),
    set: jest.fn(),
    clearNamespace: jest.fn(),
  },
}));

jest.mock('@app/services/seventv-service', () => ({
  sevenTvService: {
    get7tvUserId: jest.fn(),
    getUserCosmeticsGql: jest.fn(),
    sendPresence: jest.fn(() => Promise.resolve()),
  },
  clearSevenTvUserCache: jest.fn(),
}));

jest.mock('@app/utils/seventv/sevenTvSessionId', () => ({
  getSevenTvSessionId: jest.fn(() => null),
}));

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
  // Clears the session cosmetics cache and any pending debounced snapshot
  // sync so refreshes triggered by re-added definitions cannot leak wearer
  // writes from a previous test into this one's storage counts.
  clearUserCosmeticsCache();
  chatStore$.paints.set({});
  chatStore$.badges.set({});
  chatStore$.userPaintIds.set({});
  chatStore$.userBadgeIds.set({});
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
      badge: undefined,
      badgeId: null,
      expiresAt: Date.now() + 30 * 60 * 1000,
      paint: undefined,
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
      badge: undefined,
      badgeId: null,
      expiresAt: Date.now() + 30 * 60 * 1000,
      paint: undefined,
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
    const cached: CachedUserCosmetics = {
      badge: buildBadge(),
      badgeId: BADGE_ID,
      expiresAt: Date.now() + 60 * 60 * 1000,
      paint: buildPaint(),
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
    const cached: CachedUserCosmetics = {
      badge: buildBadge(),
      badgeId: BADGE_ID,
      expiresAt: Date.now() + 60 * 60 * 1000,
      paint: buildPaint(),
      paintId: PAINT_ID,
      ttvUserId: 'ttv-user-0',
    };
    jest.mocked(storageService.getString).mockReturnValueOnce(cached);
    await fetchAndCacheUserCosmetics('stv-user-0');

    setUserPaint('ttv-user-0', 'paint-other');
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
});
