import { act, renderHook, waitFor } from '@testing-library/react-native';

import { sevenTvService } from '@app/services/seventv-service';
import {
  fetchAndCacheUserCosmetics,
  getUserBadge,
  getUserBadgeId,
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
  hasUserPaint: jest.fn(),
  requestUserCosmeticsViaPresence: jest.fn(() => Promise.resolve()),
}));

jest.mock('@app/utils/logger', () => ({
  logger: {
    stv: { debug: jest.fn() },
  },
}));

type MockObservableValue<T> = {
  peek: jest.Mock<T | undefined, []>;
};

jest.mock('@app/store/chat/observables/chatStore', () => ({
  chatStore$: {
    userBadgeIds: {},
    userPaintIds: {},
  },
}));

const mockGet7tvUserId = jest.mocked(sevenTvService.get7tvUserId);
const mockFetchAndCacheUserCosmetics = jest.mocked(fetchAndCacheUserCosmetics);
const mockGetUserBadge = jest.mocked(getUserBadge);
const mockGetUserBadgeId = jest.mocked(getUserBadgeId);
const mockHasUserPaint = jest.mocked(hasUserPaint);
const mockRequestUserCosmeticsViaPresence = jest.mocked(
  requestUserCosmeticsViaPresence,
);

const mockChatStore = jest.requireMock('@app/store/chat/observables/chatStore')
  .chatStore$ as {
  userBadgeIds: Record<string, MockObservableValue<string>>;
  userPaintIds: Record<string, MockObservableValue<string>>;
};

function setCachedCosmetics({
  badgeId,
  paintId,
  twitchUserId,
}: {
  badgeId?: string;
  paintId?: string;
  twitchUserId: string;
}) {
  mockChatStore.userBadgeIds[twitchUserId] = {
    peek: jest.fn(() => badgeId),
  };
  mockChatStore.userPaintIds[twitchUserId] = {
    peek: jest.fn(() => paintId),
  };
}

describe('useChatCosmetics', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGet7tvUserId.mockResolvedValue('7tv-user-1');
    mockFetchAndCacheUserCosmetics.mockResolvedValue('ttv-self');
    mockGetUserBadge.mockReturnValue(undefined);
    mockGetUserBadgeId.mockReturnValue(undefined);
    mockHasUserPaint.mockReturnValue(false);
    Object.keys(mockChatStore.userBadgeIds).forEach(key => {
      delete mockChatStore.userBadgeIds[key];
    });
    Object.keys(mockChatStore.userPaintIds).forEach(key => {
      delete mockChatStore.userPaintIds[key];
    });
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

  test('retries a previously fetched user when retryMissingBadge is requested and no renderable badge exists', async () => {
    setCachedCosmetics({
      paintId: 'paint-1',
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
});
