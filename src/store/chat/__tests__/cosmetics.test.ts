import { storageService } from '@app/lib/storage';
import { sevenTvService } from '@app/services/seventv-service';
import {
  getUserBadge,
  requestUserCosmeticsViaPresence,
} from '@app/store/chat/actions/cosmetics';
import type { SanitisedBadgeSet } from '@app/types/twitch/badge';
import { getSevenTvSessionId } from '@app/utils/seventv/sevenTvSessionId';

jest.mock('@app/components/Chat/util/normalizeSevenTvCosmetics', () => ({
  buildSevenTvBadgeImageUrl: jest.fn(
    (badgeId: string) => `https://cdn.7tv.app/badge/${badgeId}/4x.webp`,
  ),
  normalizeSevenTvBadge: jest.fn((badge: Record<string, unknown>) => badge),
}));

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

jest.mock('@app/store/chat/observables/chatStore', () => ({
  chatStore$: {
    currentChannelId: { peek: jest.fn(() => 'channel-1') },
    badges: {},
    userBadgeIds: {},
  },
}));

import { reportMissingBadge } from '@app/store/chat/actions/missingBadges';
import { chatStore$ } from '@app/store/chat/observables/chatStore';

type MockObservableValue<T> = {
  peek: jest.Mock<T, []>;
  set: jest.Mock<void, [T]>;
};

const mockChatStore = chatStore$ as unknown as {
  badges: Record<string, MockObservableValue<unknown>>;
  userBadgeIds: Record<string, MockObservableValue<string>>;
};

jest.mock('@app/store/chat/observables/cosmeticsPersistence', () => ({
  writePersistedCosmetics: jest.fn(),
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
