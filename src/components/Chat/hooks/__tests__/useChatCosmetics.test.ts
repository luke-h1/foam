import { sevenTvService } from '@app/services/seventv-service';
import { fetchAndCacheUserCosmetics } from '@app/store/chat/actions/cosmetics';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import { useChatCosmetics } from '../useChatCosmetics';

type MockObservableValue<T> = {
  peek: jest.Mock<T | undefined, []>;
};

jest.mock('@app/services/seventv-service', () => ({
  sevenTvService: {
    get7tvUserId: jest.fn(),
  },
}));

jest.mock('@app/store/chat/actions/cosmetics', () => ({
  fetchAndCacheUserCosmetics: jest.fn(() => Promise.resolve()),
}));

jest.mock('@app/store/chat/observables/chatStore', () => ({
  chatStore$: {
    userBadgeIds: {},
    userPaintIds: {},
  },
}));

jest.mock('@app/utils/logger', () => ({
  logger: {
    stvWs: {
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
    },
  },
}));

const mockGetSevenTvUserId = jest.mocked(sevenTvService.get7tvUserId);
const mockFetchAndCacheUserCosmetics = jest.mocked(fetchAndCacheUserCosmetics);

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
    Object.keys(mockChatStore.userBadgeIds).forEach(key => {
      delete mockChatStore.userBadgeIds[key];
    });
    Object.keys(mockChatStore.userPaintIds).forEach(key => {
      delete mockChatStore.userPaintIds[key];
    });
    mockGetSevenTvUserId.mockResolvedValue('7tv-user-1');
    mockFetchAndCacheUserCosmetics.mockResolvedValue(null);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('fetches current user cosmetics after mount', async () => {
    renderHook(() =>
      useChatCosmetics({
        channelId: 'channel-1',
        userId: 'current-user',
      }),
    );

    await waitFor(() => {
      expect(mockGetSevenTvUserId).toHaveBeenCalledWith('current-user');
      expect(mockFetchAndCacheUserCosmetics).toHaveBeenCalledWith('7tv-user-1');
    });
  });

  test('limits opportunistic cosmetic fetches to the initial chat window', async () => {
    jest.useFakeTimers({ now: new Date('2026-06-08T12:00:00.000Z') });
    const { result } = renderHook(() =>
      useChatCosmetics({
        channelId: 'channel-window',
        userId: null,
      }),
    );

    expect(result.current.canFetchCosmetics()).toBe(true);

    act(() => {
      jest.advanceTimersByTime(5001);
    });

    expect(result.current.canFetchCosmetics()).toBe(false);

    await act(async () => {
      await result.current.fetchUserCosmetics('late-user');
    });

    expect(mockGetSevenTvUserId).not.toHaveBeenCalledWith('late-user');

    await act(async () => {
      await result.current.fetchUserCosmetics('allowed-user', {
        allowAfterInitialWindow: true,
      });
    });

    expect(mockGetSevenTvUserId).toHaveBeenCalledWith('allowed-user');
  });

  test('does not refetch users that already have cached paint and badge cosmetics', async () => {
    setCachedCosmetics({
      badgeId: 'badge-1',
      paintId: 'paint-1',
      twitchUserId: 'cached-user',
    });
    const { result } = renderHook(() =>
      useChatCosmetics({
        channelId: 'channel-1',
        userId: null,
      }),
    );

    await act(async () => {
      await result.current.fetchUserCosmetics('cached-user');
    });

    expect(mockGetSevenTvUserId).not.toHaveBeenCalledWith('cached-user');
    expect(mockFetchAndCacheUserCosmetics).not.toHaveBeenCalled();
    expect(
      result.current.fetchedCosmeticsUsersRef.current.has('cached-user'),
    ).toBe(true);
  });

  test('retries a previously fetched user when retryMissingBadge is requested and no badge is cached', async () => {
    setCachedCosmetics({
      paintId: 'paint-1',
      twitchUserId: 'retry-user',
    });
    const { result } = renderHook(() =>
      useChatCosmetics({
        channelId: 'channel-1',
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

    expect(mockGetSevenTvUserId.mock.calls).toEqual([
      ['retry-user'],
      ['retry-user'],
    ]);
  });
});
