import { storageService } from '@app/lib/storage';
import { sevenTvService } from '@app/services/seven-tv-service';
import {
  type CachedUserCosmetics,
  clearUserCosmeticsCache,
  getUserBadge,
  requestUserCosmeticsViaPresence,
  syncCachedUserCosmeticsFromStore,
} from '@app/store/chat/actions/cosmetics';
import {
  clearAllMissingBadges,
  getMissingBadgeIds,
} from '@app/store/chat/actions/missing-badges';
import { chatStore$ } from '@app/store/chat/observables/chat-store';
import type { SanitisedBadgeSet } from '@app/types/twitch/badge';
import { logger } from '@app/utils/logger';
import { setSevenTvSessionId } from '@app/utils/seven-tv/sevenTvSessionId';

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

const cosmeticsStorageKey = 'sevenTvUserCosmetics_user-cosmetics:stv-user-1';

const readStoredCosmetics = () =>
  storageService.getString<CachedUserCosmetics>(
    cosmeticsStorageKey,
    'seven_tv_cache',
  );

beforeEach(() => {
  storageService.clearNamespace('seven_tv_cache');
  clearUserCosmeticsCache();
  clearAllMissingBadges();
  setSevenTvSessionId(null);
});

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

    expect(getMissingBadgeIds()).toEqual([]);
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

    expect(getMissingBadgeIds()).toEqual(['01GAF994D8000E8VNG1S1RMTBC']);
  });

  test('repairs an empty stored url from the badge id and keeps the title', () => {
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
      title: 'Supporter',
      set: 'badge-1',
      provider: '7tv',
    });

    expect(getMissingBadgeIds()).toEqual([]);
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

    expect(readStoredCosmetics()).toEqual<CachedUserCosmetics>(
      expectedCosmetics,
    );

    jest.setSystemTime(Date.now() + TWO_HOURS_MS - 1);
    expect(readStoredCosmetics()).toEqual<CachedUserCosmetics>(
      expectedCosmetics,
    );

    jest.setSystemTime(Date.now() + 1);
    expect(readStoredCosmetics()).toBeNull();
  });

  test('a later sync with the same binding refreshes storage expiry', () => {
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

    const expectedCosmetics: CachedUserCosmetics = {
      badgeId: 'badge-1',
      expiresAt: Date.now() + TWO_HOURS_MS,
      paintId: null,
      ttvUserId: 'ttv-1',
    };

    syncCachedUserCosmeticsFromStore('stv-user-1', 'ttv-1');

    expect(readStoredCosmetics()).toEqual<CachedUserCosmetics>(
      expectedCosmetics,
    );

    jest.setSystemTime(Date.now() + 1000);
    syncCachedUserCosmeticsFromStore('stv-user-1', 'ttv-1');

    expect(readStoredCosmetics()).toEqual<CachedUserCosmetics>({
      badgeId: 'badge-1',
      expiresAt: Date.now() + TWO_HOURS_MS,
      paintId: null,
      ttvUserId: 'ttv-1',
    });
  });

  test('writes a 30m negative-cache expiry when the user has no cosmetic bindings', () => {
    syncCachedUserCosmeticsFromStore('stv-user-1', 'ttv-1');

    const expectedCosmetics: CachedUserCosmetics = {
      badgeId: null,
      expiresAt: Date.now() + THIRTY_MINUTES_MS,
      paintId: null,
      ttvUserId: 'ttv-1',
    };

    expect(readStoredCosmetics()).toEqual<CachedUserCosmetics>(
      expectedCosmetics,
    );

    jest.setSystemTime(Date.now() + THIRTY_MINUTES_MS - 1);
    expect(readStoredCosmetics()).toEqual<CachedUserCosmetics>(
      expectedCosmetics,
    );

    jest.setSystemTime(Date.now() + 1);
    expect(readStoredCosmetics()).toBeNull();
  });
});

describe('requestUserCosmeticsViaPresence', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    chatStore$.currentChannelId.set('channel-1');
    mockGet7tvUserId.mockResolvedValue('7tv-user-1');
    mockGetUserCosmeticsGql.mockResolvedValue(null);
  });

  test('writes a passive presence for the chatter when a session is live', async () => {
    setSevenTvSessionId('session-1');

    await requestUserCosmeticsViaPresence('ttv-1');

    expect(mockGet7tvUserId.mock.calls).toEqual([['ttv-1']]);

    expect(mockSendPresence.mock.calls).toEqual([
      ['channel-1', '7tv-user-1', { passive: true, sessionId: 'session-1' }],
    ]);

    expect(mockGetUserCosmeticsGql).not.toHaveBeenCalled();
  });

  test('falls back to the GQL fetch when there is no live session', async () => {
    await requestUserCosmeticsViaPresence('ttv-1');

    expect(mockSendPresence).not.toHaveBeenCalled();

    expect(mockGetUserCosmeticsGql.mock.calls).toEqual([['7tv-user-1']]);
  });

  test('does nothing when the Twitch id cannot be resolved to a 7TV user', async () => {
    mockGet7tvUserId.mockResolvedValue('');
    setSevenTvSessionId('session-1');

    await requestUserCosmeticsViaPresence('ttv-1');

    expect(mockSendPresence).not.toHaveBeenCalled();

    expect(mockGetUserCosmeticsGql).not.toHaveBeenCalled();
  });
});
