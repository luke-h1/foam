import { storageService } from '@app/lib/storage';
import { sevenTvService } from '@app/services/seventv-service';
import {
  type CachedUserCosmetics,
  getUserBadge,
  requestUserCosmeticsViaPresence,
  syncCachedUserCosmeticsFromStore,
} from '@app/store/chat/actions/cosmetics';
import * as MissingBadgesModule from '@app/store/chat/actions/missingBadges';
import { chatStore$ } from '@app/store/chat/observables/chatStore';
import type { SanitisedBadgeSet } from '@app/types/twitch/badge';
import { logger } from '@app/utils/logger';
import * as NormalizeSevenTvBadgeModule from '@app/utils/seventv/cosmetics/normalizeSevenTvBadge';
import * as SevenTvSessionIdModule from '@app/utils/seventv/sevenTvSessionId';

// getUserBadge's title-fallback branch only fires when a stored badge's url
// is unresolvable as-is; the real normalizer repairs empty/relative 7TV urls,
// which would mask that branch entirely.
jest
  .spyOn(NormalizeSevenTvBadgeModule, 'normalizeSevenTvBadge')
  .mockImplementation((badge: SanitisedBadgeSet) => badge);

jest.spyOn(logger.stv, 'warn').mockImplementation(() => {});
jest.spyOn(logger.stvWs, 'info').mockImplementation(() => {});
jest.spyOn(logger.stvWs, 'debug').mockImplementation(() => {});
jest.spyOn(logger.stvWs, 'warn').mockImplementation(() => {});
jest.spyOn(logger.stvWs, 'error').mockImplementation(() => {});

const mockGet7tvUserId = jest.spyOn(sevenTvService, 'get7tvUserId');
const mockGetUserCosmeticsGql = jest.spyOn(
  sevenTvService,
  'getUserCosmeticsGql',
);
const mockSendPresence = jest
  .spyOn(sevenTvService, 'sendPresence')
  .mockResolvedValue(undefined);
const mockGetSessionId = jest.spyOn(
  SevenTvSessionIdModule,
  'getSevenTvSessionId',
);
const mockGetString = jest
  .spyOn(storageService, 'getString')
  .mockReturnValue(null);
const mockSet = jest.spyOn(storageService, 'set').mockImplementation(() => {});
jest.spyOn(storageService, 'clearNamespace').mockImplementation(() => {});
const mockReportMissingBadge = jest.spyOn(
  MissingBadgesModule,
  'reportMissingBadge',
);

describe('getUserBadge', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    chatStore$.userBadgeIds.set({});
    chatStore$.badges.set({});
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
    chatStore$.userBadgeIds.set({ 'ttv-1': 'badge-1' });
    chatStore$.badges.set({ 'badge-1': badge });

    expect(getUserBadge('ttv-1')).toEqual<SanitisedBadgeSet>(badge);
    expect(mockReportMissingBadge).not.toHaveBeenCalled();
  });

  test('derives the badge from its id when bound but not loaded, and tracks it', () => {
    chatStore$.userBadgeIds.set({
      'ttv-scummy': '01GAF994D8000E8VNG1S1RMTBC',
    });

    expect(getUserBadge('ttv-scummy')).toEqual<SanitisedBadgeSet>({
      id: '01GAF994D8000E8VNG1S1RMTBC',
      url: 'https://cdn.7tv.app/badge/01GAF994D8000E8VNG1S1RMTBC/4x.webp',
      type: '7TV Badge',
      title: '7TV Badge',
      set: '01GAF994D8000E8VNG1S1RMTBC',
      provider: '7tv',
    });
    expect(mockReportMissingBadge.mock.calls).toEqual([
      ['01GAF994D8000E8VNG1S1RMTBC', 'ttv-scummy'],
    ]);
  });

  test('derives the badge from its id when the stored definition has an empty url', () => {
    chatStore$.userBadgeIds.set({ 'ttv-1': 'badge-1' });
    chatStore$.badges.set({
      'badge-1': {
        id: 'badge-1',
        url: '',
        type: '7TV Badge',
        title: 'Supporter',
        set: 'badge-1',
        provider: '7tv',
      },
    });

    expect(getUserBadge('ttv-1')).toEqual<SanitisedBadgeSet>({
      id: 'badge-1',
      url: 'https://cdn.7tv.app/badge/badge-1/4x.webp',
      type: '7TV Badge',
      title: '7TV Badge',
      set: 'badge-1',
      provider: '7tv',
    });
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
    chatStore$.userBadgeIds.set({});
    chatStore$.userPaintIds.set({});
    chatStore$.badges.set({});
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('writes a 2h cache expiry when the user has cosmetic bindings', () => {
    chatStore$.userBadgeIds.set({ 'ttv-1': 'badge-1' });
    chatStore$.badges.set({
      'badge-1': {
        id: 'badge-1',
        url: 'https://cdn.7tv.app/badge/badge-1/4x.webp',
        type: '7TV Badge',
        title: 'Supporter',
        set: 'badge-1',
        provider: '7tv',
      },
    });

    syncCachedUserCosmeticsFromStore('stv-user-1', 'ttv-1');

    const expectedCosmetics: CachedUserCosmetics = {
      badgeId: 'badge-1',
      expiresAt: Date.now() + TWO_HOURS_MS,
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
      badgeId: null,
      expiresAt: Date.now() + THIRTY_MINUTES_MS,
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
    chatStore$.currentChannelId.set('channel-1');
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
