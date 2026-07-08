import { act, renderHook, waitFor } from '@testing-library/react-native';

import { sevenTvService } from '@app/services/seventv-service';
import { fetchAndCacheUserCosmetics } from '@app/store/chat/actions/cosmetics';
import { requestUserCosmetics } from '@app/store/chat/actions/cosmeticsBridge';

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

jest.mock('@app/store/chat/actions/cosmeticsBridge', () => ({
  requestUserCosmetics: jest.fn(() => Promise.resolve()),
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
const mockRequestUserCosmetics = jest.mocked(requestUserCosmetics);

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
    mockRequestUserCosmetics.mockResolvedValue(undefined);
  });

  test('fetches current user cosmetics after mount', async () => {
    renderHook(() =>
      useChatCosmetics({
        userId: 'current-user',
      }),
    );

    await waitFor(() => {
      expect(mockGetSevenTvUserId).toHaveBeenCalledWith('current-user');
      expect(mockFetchAndCacheUserCosmetics).toHaveBeenCalledWith('7tv-user-1');
    });
  });

  test('queues chatters on the bridge batcher', async () => {
    const { result } = renderHook(() =>
      useChatCosmetics({
        userId: null,
      }),
    );

    await act(async () => {
      await result.current.fetchUserCosmetics('chatter-1', 'chatter-login');
    });

    expect(mockRequestUserCosmetics.mock.calls).toEqual([
      ['chatter-1', 'chatter-login'],
    ]);
  });

  test('does not refetch users that already have cached paint and badge cosmetics', async () => {
    setCachedCosmetics({
      badgeId: 'badge-1',
      paintId: 'paint-1',
      twitchUserId: 'cached-user',
    });
    const { result } = renderHook(() =>
      useChatCosmetics({
        userId: null,
      }),
    );

    await act(async () => {
      await result.current.fetchUserCosmetics('cached-user', 'cached-login');
    });

    expect(mockRequestUserCosmetics).not.toHaveBeenCalled();
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
        userId: null,
      }),
    );

    await act(async () => {
      await result.current.fetchUserCosmetics('retry-user', 'retry-login');
      await result.current.fetchUserCosmetics('retry-user', 'retry-login');
      await result.current.fetchUserCosmetics('retry-user', 'retry-login', {
        retryMissingBadge: true,
      });
    });

    expect(mockRequestUserCosmetics.mock.calls).toEqual([
      ['retry-user', 'retry-login'],
      ['retry-user', 'retry-login'],
    ]);
  });
});
