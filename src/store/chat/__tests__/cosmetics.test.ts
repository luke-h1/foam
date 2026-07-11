import { storageService } from '@app/lib/storage';
import { sevenTvService } from '@app/services/seventv-service';
import {
  type CachedUserCosmetics,
  getUserBadge,
  requestUserCosmeticsViaPresence,
  syncCachedUserCosmeticsFromStore,
} from '@app/store/chat/actions/cosmetics';
import type { SanitisedBadgeSet } from '@app/types/twitch/badge';
import { getSevenTvSessionId } from '@app/utils/seventv/sevenTvSessionId';

jest.mock(
  '@app/components/Chat/util/normalizeSevenTvCosmetics/buildSevenTvBadgeImageUrl',
  () => ({
    buildSevenTvBadgeImageUrl: jest.fn(
      (badgeId: string) => `https://cdn.7tv.app/badge/${badgeId}/4x.webp`,
    ),
  }),
);

jest.mock(
  '@app/components/Chat/util/normalizeSevenTvCosmetics/normalizeSevenTvBadge',
  () => ({
    normalizeSevenTvBadge: jest.fn((badge: Record<string, unknown>) => badge),
  }),
);

jest.mock('@app/store/chat/actions/missingBadges', () => ({
  clearAllMissingBadges: jest.fn(),
  clearMissingBadge: jest.fn(),
  reportMissingBadge: jest.fn(),
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
  getSevenTvSessionId: jest.fn(),
}));

jest.mock('@app/lib/storage', () => ({
  storageService: {
    getString: jest.fn(() => null),
    set: jest.fn(),
    clearNamespace: jest.fn(),
  },
}));

type MockObservableValue<T> = {
  peek: jest.Mock<T, []>;
  set: jest.Mock<void, [T]>;
};

type MockChatStore = {
  currentChannelId: { peek: jest.Mock<string, []> };
  badges: Record<string, MockObservableValue<unknown>>;
  paints: Record<string, MockObservableValue<unknown>>;
  userBadgeIds: Record<string, MockObservableValue<string | null>>;
  userPaintIds: Record<string, MockObservableValue<string | null>>;
};

jest.mock('@app/store/chat/observables/chatStore', () => ({
  chatStore$: {
    currentChannelId: { peek: jest.fn(() => 'channel-1') },
    badges: {},
    paints: {},
    userBadgeIds: {},
    userPaintIds: {},
  },
}));

import { reportMissingBadge } from '@app/store/chat/actions/missingBadges';

const { chatStore$: mockChatStore } = jest.requireMock<{
  chatStore$: MockChatStore;
}>('@app/store/chat/observables/chatStore');

jest.mock('@app/store/chat/observables/cosmeticsPersistence', () => ({
  writePersistedCosmeticBindings: jest.fn(),
  writePersistedCosmeticDefinitions: jest.fn(),
}));

jest.mock('@app/utils/logger', () => ({
  logger: {
    stv: { warn: jest.fn() },
    stvWs: {
      info: jest.fn(),
      debug: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    },
  },
}));

const mockGet7tvUserId = jest.mocked(sevenTvService.get7tvUserId);
const mockGetUserCosmeticsGql = jest.mocked(sevenTvService.getUserCosmeticsGql);
const mockSendPresence = jest.mocked(sevenTvService.sendPresence);
const mockGetSessionId = jest.mocked(getSevenTvSessionId);
const mockGetString = jest.mocked(storageService.getString);
const mockSet = jest.mocked(storageService.set);
const mockReportMissingBadge = jest.mocked(reportMissingBadge);

describe('getUserBadge', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Object.keys(mockChatStore.userBadgeIds).forEach(key => {
      delete mockChatStore.userBadgeIds[key];
    });
    Object.keys(mockChatStore.badges).forEach(key => {
      delete mockChatStore.badges[key];
    });
  });

  test('returns undefined when the user has no badge binding', () => {
    expect(getUserBadge('ttv-1')).toBeUndefined();
  });

  test('returns the stored badge definition when present', () => {
    const badge: SanitisedBadgeSet = {
      id: 'badge-1',
      url: 'https://cdn.7tv.app/badge/badge-1/4x.webp',
      type: '7TV Badge',
      title: 'Supporter',
      set: 'badge-1',
      provider: '7tv',
    };
    mockChatStore.userBadgeIds['ttv-1'] = {
      peek: jest.fn(() => 'badge-1'),
      set: jest.fn(),
    };
    mockChatStore.badges['badge-1'] = {
      peek: jest.fn(() => badge),
      set: jest.fn(),
    };

    expect(getUserBadge('ttv-1')).toEqual<SanitisedBadgeSet>(badge);
    expect(mockReportMissingBadge).not.toHaveBeenCalled();
  });

  test('returns undefined and tracks the missing definition when bound but not loaded', () => {
    mockChatStore.userBadgeIds['ttv-scummy'] = {
      peek: jest.fn(() => '01GAF994D8000E8VNG1S1RMTBC'),
      set: jest.fn(),
    };

    expect(getUserBadge('ttv-scummy')).toBeUndefined();
    expect(mockReportMissingBadge.mock.calls).toEqual([
      ['01GAF994D8000E8VNG1S1RMTBC', 'ttv-scummy'],
    ]);
  });

  test('returns undefined when the stored definition has an empty url', () => {
    mockChatStore.userBadgeIds['ttv-1'] = {
      peek: jest.fn(() => 'badge-1'),
      set: jest.fn(),
    };
    mockChatStore.badges['badge-1'] = {
      peek: jest.fn(() => ({
        id: 'badge-1',
        url: '',
        type: '7TV Badge',
        title: 'Supporter',
        set: 'badge-1',
        provider: '7tv',
      })),
      set: jest.fn(),
    };

    expect(getUserBadge('ttv-1')).toBeUndefined();
    expect(mockReportMissingBadge.mock.calls).toEqual([['badge-1', 'ttv-1']]);
  });
});

describe('syncCachedUserCosmeticsFromStore', () => {
  const TWO_HOURS_MS = 2 * 60 * 60 * 1000;
  const THIRTY_MINUTES_MS = 30 * 60 * 1000;

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-01-01T00:00:00Z'));
    jest.clearAllMocks();
    Object.keys(mockChatStore.userBadgeIds).forEach(key => {
      delete mockChatStore.userBadgeIds[key];
    });
    Object.keys(mockChatStore.userPaintIds).forEach(key => {
      delete mockChatStore.userPaintIds[key];
    });
    Object.keys(mockChatStore.badges).forEach(key => {
      delete mockChatStore.badges[key];
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('writes a 2h cache expiry when the user has cosmetic bindings', () => {
    mockChatStore.userBadgeIds['ttv-1'] = {
      peek: jest.fn(() => 'badge-1'),
      set: jest.fn(),
    };
    mockChatStore.badges['badge-1'] = {
      peek: jest.fn(() => ({
        id: 'badge-1',
        url: 'https://cdn.7tv.app/badge/badge-1/4x.webp',
        type: '7TV Badge',
        title: 'Supporter',
        set: 'badge-1',
        provider: '7tv',
      })),
      set: jest.fn(),
    };

    syncCachedUserCosmeticsFromStore('stv-user-1', 'ttv-1');

    const expectedCosmetics: CachedUserCosmetics = {
      badge: {
        id: 'badge-1',
        provider: '7tv',
        set: 'badge-1',
        title: 'Supporter',
        type: '7TV Badge',
        url: 'https://cdn.7tv.app/badge/badge-1/4x.webp',
      },
      badgeId: 'badge-1',
      expiresAt: Date.now() + TWO_HOURS_MS,
      paint: undefined,
      paintId: null,
      ttvUserId: 'ttv-1',
    };
    expect(mockSet.mock.calls).toEqual([
      [
        'sevenTvUserCosmetics_user-cosmetics:stv-user-1',
        expectedCosmetics,
        'seven_tv_cache',
        { expiry: new Date(Date.now() + TWO_HOURS_MS) },
      ],
    ]);
  });

  test('writes a 30m negative-cache expiry when the user has no cosmetic bindings', () => {
    syncCachedUserCosmeticsFromStore('stv-user-1', 'ttv-1');

    const expectedCosmetics: CachedUserCosmetics = {
      badge: undefined,
      badgeId: null,
      expiresAt: Date.now() + THIRTY_MINUTES_MS,
      paint: undefined,
      paintId: null,
      ttvUserId: 'ttv-1',
    };
    expect(mockSet.mock.calls).toEqual([
      [
        'sevenTvUserCosmetics_user-cosmetics:stv-user-1',
        expectedCosmetics,
        'seven_tv_cache',
        { expiry: new Date(Date.now() + THIRTY_MINUTES_MS) },
      ],
    ]);
  });
});

describe('requestUserCosmeticsViaPresence', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGet7tvUserId.mockResolvedValue('7tv-user-1');
    mockGetUserCosmeticsGql.mockResolvedValue(null);
    mockGetString.mockReturnValue(null);
  });

  test('writes a passive presence for the chatter when a session is live', async () => {
    mockGetSessionId.mockReturnValue('session-1');

    await requestUserCosmeticsViaPresence('ttv-1');

    expect(mockGet7tvUserId.mock.calls).toEqual([['ttv-1']]);
    expect(mockSendPresence.mock.calls).toEqual([
      ['channel-1', '7tv-user-1', { passive: true, sessionId: 'session-1' }],
    ]);
    expect(mockGetUserCosmeticsGql).not.toHaveBeenCalled();
  });

  test('falls back to the GQL fetch when there is no live session', async () => {
    mockGetSessionId.mockReturnValue(null);

    await requestUserCosmeticsViaPresence('ttv-1');

    expect(mockSendPresence).not.toHaveBeenCalled();
    expect(mockGetUserCosmeticsGql.mock.calls).toEqual([['7tv-user-1']]);
  });

  test('does nothing when the Twitch id cannot be resolved to a 7TV user', async () => {
    mockGet7tvUserId.mockResolvedValue('');
    mockGetSessionId.mockReturnValue('session-1');

    await requestUserCosmeticsViaPresence('ttv-1');

    expect(mockSendPresence).not.toHaveBeenCalled();
    expect(mockGetUserCosmeticsGql).not.toHaveBeenCalled();
  });
});
