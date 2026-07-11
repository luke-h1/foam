import { storageService } from '@app/lib/storage';
import {
  addBadge,
  addPaint,
  removeBadge,
  setUserBadge,
  setUserPaint,
  syncCachedUserCosmeticsFromStore,
} from '@app/store/chat/actions/cosmetics';
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
  clearSevenTvUserIdCache: jest.fn(),
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
  chatStore$.paints.set({});
  chatStore$.badges.set({});
  chatStore$.userPaintIds.set({});
  chatStore$.userBadgeIds.set({});
  chatStore$.sessionCaches.userPaintFlags.set({});
  chatStore$.cosmeticBindingsVersion.set(0);
  jest.mocked(storageService.set).mockClear();
}

function runEntitlementBurst(userCount: number): void {
  for (let index = 0; index < userCount; index += 1) {
    const ttvUserId = `ttv-user-${index}`;
    const sevenTvUserId = `stv-user-${index}`;
    addPaint(buildPaint());
    addBadge(buildBadge());
    setUserPaint(ttvUserId, PAINT_ID);
    setUserBadge(ttvUserId, BADGE_ID);
    syncCachedUserCosmeticsFromStore(sevenTvUserId, ttvUserId);
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

  test('a 100-wearer burst writes each wearer cache entry exactly once', () => {
    runEntitlementBurst(100);

    expect(jest.mocked(storageService.set).mock.calls).toHaveLength(100);
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
