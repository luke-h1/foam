import { act, renderHook, waitFor } from '@testing-library/react-native';

import { sevenTvService } from '@app/services/seventv-service';
import {
  fetchAndCacheUserCosmetics,
  getUserBadge,
  getUserBadgeId,
  getUserPaintId,
  hasUserPaint,
  requestUserCosmeticsViaPresence,
} from '@app/store/chat/actions/cosmetics';

import { useChatCosmetics } from '../useChatCosmetics';

jest.mock('@app/services/seventv-service', () => ({
  sevenTvService: {
    get7tvUserId: jest.fn(),
  },
}));

jest.mock('@app/store/chat/actions/cosmetics', () => ({
  fetchAndCacheUserCosmetics: jest.fn(),
  getUserBadge: jest.fn(),
  getUserBadgeId: jest.fn(),
  getUserPaintId: jest.fn(),
  hasUserPaint: jest.fn(),
  requestUserCosmeticsViaPresence: jest.fn(() => Promise.resolve()),
}));

jest.mock('@app/utils/logger', () => ({
  logger: {
    stv: { debug: jest.fn() },
  },
}));

const mockGet7tvUserId = jest.mocked(sevenTvService.get7tvUserId);
const mockFetchAndCacheUserCosmetics = jest.mocked(fetchAndCacheUserCosmetics);
const mockGetUserBadge = jest.mocked(getUserBadge);
const mockGetUserBadgeId = jest.mocked(getUserBadgeId);
const mockGetUserPaintId = jest.mocked(getUserPaintId);
const mockHasUserPaint = jest.mocked(hasUserPaint);
const mockRequestUserCosmeticsViaPresence = jest.mocked(
  requestUserCosmeticsViaPresence,
);

function setCachedCosmetics({
  badgeId,
  paintId,
  twitchUserId,
}: {
  badgeId?: string;
  paintId?: string;
  twitchUserId: string;
}) {
  mockGetUserBadgeId.mockImplementation(userId =>
    userId === twitchUserId ? badgeId : undefined,
  );
  mockGetUserPaintId.mockImplementation(userId =>
    userId === twitchUserId ? paintId : undefined,
  );
}

describe('useChatCosmetics', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGet7tvUserId.mockResolvedValue('7tv-user-1');
    mockFetchAndCacheUserCosmetics.mockResolvedValue('ttv-self');
    mockGetUserBadge.mockReturnValue(undefined);
    mockGetUserBadgeId.mockReturnValue(undefined);
    mockGetUserPaintId.mockReturnValue(undefined);
    mockHasUserPaint.mockReturnValue(false);
  });

  test('bootstraps the signed-in user cosmetics on mount', async () => {
    renderHook(() =>
      useChatCosmetics({
        userId: 'ttv-self',
      }),
    );

    await waitFor(() => {
      expect(mockGet7tvUserId.mock.calls).toEqual([['ttv-self']]);
      expect(mockFetchAndCacheUserCosmetics.mock.calls).toEqual([
        ['7tv-user-1'],
      ]);
    });
  });

  test('skips self bootstrap when paint and badge bindings are already known', async () => {
    mockHasUserPaint.mockReturnValue(true);
    mockGetUserBadgeId.mockReturnValue('badge-1');

    renderHook(() =>
      useChatCosmetics({
        userId: 'ttv-self',
      }),
    );

    await act(async () => {
      await Promise.resolve();
    });

    expect(mockFetchAndCacheUserCosmetics).not.toHaveBeenCalled();
  });

  test('requests cosmetics via passive presence for visible chatters', async () => {
    const { result } = renderHook(() =>
      useChatCosmetics({
        userId: null,
      }),
    );

    await act(async () => {
      await result.current.fetchUserCosmetics('chatter-1');
    });

    expect(mockRequestUserCosmeticsViaPresence.mock.calls).toEqual([
      ['chatter-1'],
    ]);
    expect(
      result.current.fetchedCosmeticsUsersRef.current.has('chatter-1'),
    ).toBe(true);
  });

  test('does not refetch users that already have cached paint and renderable badge cosmetics', async () => {
    setCachedCosmetics({
      badgeId: 'badge-1',
      paintId: 'paint-1',
      twitchUserId: 'cached-user',
    });
    mockGetUserBadge.mockReturnValue({
      id: 'badge-1',
      url: 'https://cdn.7tv.app/badge/badge-1/4x.webp',
      type: '7TV Badge',
      title: 'Supporter',
      set: 'badge-1',
      provider: '7tv',
    });

    const { result } = renderHook(() =>
      useChatCosmetics({
        userId: null,
      }),
    );

    await act(async () => {
      await result.current.fetchUserCosmetics('cached-user');
    });

    expect(mockRequestUserCosmeticsViaPresence).not.toHaveBeenCalled();
    expect(
      result.current.fetchedCosmeticsUsersRef.current.has('cached-user'),
    ).toBe(true);
  });

  test('does not refetch paint-only users when retryMissingBadge is requested', async () => {
    setCachedCosmetics({
      paintId: 'paint-1',
      twitchUserId: 'paint-only-user',
    });
    mockGetUserBadge.mockReturnValue(undefined);

    const { result } = renderHook(() =>
      useChatCosmetics({
        userId: null,
      }),
    );

    await act(async () => {
      await result.current.fetchUserCosmetics('paint-only-user');
      await result.current.fetchUserCosmetics('paint-only-user', {
        retryMissingBadge: true,
      });
    });

    expect(mockRequestUserCosmeticsViaPresence.mock.calls).toEqual([]);
    expect(
      result.current.fetchedCosmeticsUsersRef.current.has('paint-only-user'),
    ).toBe(true);
  });

  test('retries a previously fetched user when retryMissingBadge is requested and a badge binding lacks a renderable definition', async () => {
    setCachedCosmetics({
      badgeId: 'badge-1',
      twitchUserId: 'retry-user',
    });
    mockGetUserBadge.mockReturnValue(undefined);

    const { result } = renderHook(() =>
      useChatCosmetics({
        userId: null,
      }),
    );

    await act(async () => {
      await result.current.fetchUserCosmetics('retry-user');
      await result.current.fetchUserCosmetics('retry-user');
      await result.current.fetchUserCosmetics('retry-user', {
        retryMissingBadge: true,
      });
    });

    expect(mockRequestUserCosmeticsViaPresence.mock.calls).toEqual([
      ['retry-user'],
      ['retry-user'],
    ]);
    expect(
      result.current.fetchedCosmeticsUsersRef.current.has('retry-user'),
    ).toBe(true);
  });

  test('does not refetch users that already have cached paint-only cosmetics', async () => {
    setCachedCosmetics({
      paintId: 'paint-1',
      twitchUserId: 'paint-only-user',
    });

    const { result } = renderHook(() =>
      useChatCosmetics({
        userId: null,
      }),
    );

    await act(async () => {
      await result.current.fetchUserCosmetics('paint-only-user');
    });

    expect(mockRequestUserCosmeticsViaPresence).not.toHaveBeenCalled();
    expect(
      result.current.fetchedCosmeticsUsersRef.current.has('paint-only-user'),
    ).toBe(true);
  });

  test('does not retry users whose cosmetics fetch failed', async () => {
    mockRequestUserCosmeticsViaPresence.mockRejectedValue(
      new Error('presence failed'),
    );

    const { result } = renderHook(() =>
      useChatCosmetics({
        userId: null,
      }),
    );

    await act(async () => {
      await result.current.fetchUserCosmetics('failed-user');
      await result.current.fetchUserCosmetics('failed-user');
    });

    expect(mockRequestUserCosmeticsViaPresence.mock.calls).toEqual([
      ['failed-user'],
    ]);
    expect(
      result.current.fetchedCosmeticsUsersRef.current.has('failed-user'),
    ).toBe(true);
  });
});
