import { act, renderHook, waitFor } from '@testing-library/react-native';

import {
  createAuthContextValue,
  createTestUser,
} from '@app/context/__tests__/__fixtures__/authContext.fixture';
import { useAuthContext } from '@app/context/AuthContext';
import {
  abortCurrentLoad,
  getCurrentEmoteData,
  getSevenTvEmoteSetId,
  loadChannelResources,
  startChannelLoadAbort,
} from '@app/store/chat/actions/channelLoad';
import { chatStore$ } from '@app/store/chat/observables/chatStore';
import {
  preloadChannelEmotes,
  preloadGlobalEmotes,
} from '@app/utils/image/preloadEmotes';

import { useChatEmoteLoader } from '../useChatEmoteLoader';
import {
  createEmoteData,
  createSevenTvEmote,
} from './__fixtures__/useChat.fixture';

jest.mock('@app/context/AuthContext', () => ({
  useAuthContext: jest.fn(),
}));

jest.mock('@app/store/chat/actions/channelLoad', () => ({
  abortCurrentLoad: jest.fn(),
  getCurrentEmoteData: jest.fn(),
  getSevenTvEmoteSetId: jest.fn(),
  loadChannelResources: jest.fn(),
  startChannelLoadAbort: jest.fn(),
}));

jest.mock('@app/utils/image/preloadEmotes', () => ({
  preloadChannelEmotes: jest.fn(() => Promise.resolve()),
  preloadGlobalEmotes: jest.fn(() => Promise.resolve()),
}));

jest.mock('@app/utils/logger', () => ({
  logger: {
    chat: {
      debug: jest.fn(),
      error: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
    },
  },
}));

const mockAbortCurrentLoad = jest.mocked(abortCurrentLoad);
const mockGetCurrentEmoteData = jest.mocked(getCurrentEmoteData);
const mockGetSevenTvEmoteSetId = jest.mocked(getSevenTvEmoteSetId);
const mockLoadChannelResources = jest.mocked(loadChannelResources);
const mockPreloadChannelEmotes = jest.mocked(preloadChannelEmotes);
const mockPreloadGlobalEmotes = jest.mocked(preloadGlobalEmotes);
const mockStartChannelLoadAbort = jest.mocked(startChannelLoadAbort);
const mockUseAuthContext = jest.mocked(useAuthContext);

function arrangeAbortController(controller = new AbortController()) {
  mockStartChannelLoadAbort.mockReturnValue(controller);
  return controller;
}

describe('useChatEmoteLoader', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    arrangeAbortController();
    mockUseAuthContext.mockReturnValue(
      createAuthContextValue({
        user: createTestUser({ id: 'viewer-id' }),
      }),
    );
    mockGetSevenTvEmoteSetId.mockReturnValue('set-1');
    mockGetCurrentEmoteData.mockReturnValue(
      createEmoteData({
        sevenTvChannelEmotes: [createSevenTvEmote()],
      }),
    );
    mockLoadChannelResources.mockResolvedValue(true);
  });

  test('loads channel resources on mount and preloads emotes after success', async () => {
    const controller = arrangeAbortController();
    const emoteData = createEmoteData({
      sevenTvChannelEmotes: [createSevenTvEmote()],
    });
    mockGetCurrentEmoteData.mockReturnValue(emoteData);
    const { result } = renderHook(() =>
      useChatEmoteLoader({ channelId: 'channel-1' }),
    );

    expect(result.current.status).toBe('loading');

    await waitFor(() => {
      expect(result.current.status).toBe('success');
    });
    expect(mockLoadChannelResources.mock.calls[0]?.[0]).toEqual({
      channelId: 'channel-1',
      forceRefresh: false,
      signal: controller.signal,
      twitchUserId: 'viewer-id',
    });
    expect(result.current.sevenTvEmoteSetId).toBe('set-1');
    expect(mockPreloadGlobalEmotes.mock.calls[0]?.[0]).toEqual(emoteData);
    expect(mockPreloadChannelEmotes.mock.calls[0]?.[0]).toEqual(emoteData);
  });

  test('does not load while disabled', () => {
    const { result } = renderHook(() =>
      useChatEmoteLoader({ channelId: 'channel-1', enabled: false }),
    );

    expect(result.current.status).toBe('idle');
    expect(mockLoadChannelResources).not.toHaveBeenCalled();
  });

  test('refetch forces a fresh channel load', async () => {
    const controller = arrangeAbortController();
    const { result } = renderHook(() =>
      useChatEmoteLoader({ channelId: 'channel-1', enabled: false }),
    );

    await act(async () => {
      await result.current.refetch();
    });

    expect(mockLoadChannelResources.mock.calls[0]?.[0]).toEqual({
      channelId: 'channel-1',
      forceRefresh: true,
      signal: controller.signal,
      twitchUserId: 'viewer-id',
    });
    expect(result.current.status).toBe('success');
  });

  test('force-refetches the active channel when the cosmetics cache is cleared', async () => {
    const controller = arrangeAbortController();
    const { result } = renderHook(() =>
      useChatEmoteLoader({ channelId: 'channel-1' }),
    );

    await waitFor(() => {
      expect(result.current.status).toBe('success');
    });
    expect(mockLoadChannelResources).toHaveBeenCalledTimes(1);

    act(() => {
      chatStore$.cosmeticsCacheVersion.set(version => version + 1);
    });

    await waitFor(() => {
      expect(mockLoadChannelResources).toHaveBeenCalledTimes(2);
    });
    expect(mockLoadChannelResources.mock.calls[1]?.[0]).toEqual({
      channelId: 'channel-1',
      forceRefresh: true,
      signal: controller.signal,
      twitchUserId: 'viewer-id',
    });
  });

  test('cancel aborts the active load and marks the hook cancelled while mounted', () => {
    const { result } = renderHook(() =>
      useChatEmoteLoader({ channelId: 'channel-1', enabled: false }),
    );

    act(() => {
      result.current.cancel();
    });

    expect(mockAbortCurrentLoad).toHaveBeenCalledTimes(1);
    expect(result.current.status).toBe('cancelled');
  });

  test('reports error when the resource load fails', async () => {
    mockLoadChannelResources.mockResolvedValue(false);
    const { result } = renderHook(() =>
      useChatEmoteLoader({ channelId: 'channel-1' }),
    );

    await waitFor(() => {
      expect(result.current.status).toBe('error');
    });
  });

  test('reports cancelled when the load signal is aborted before completion', async () => {
    const controller = arrangeAbortController();
    mockLoadChannelResources.mockImplementation(async () => {
      controller.abort();
      return true;
    });
    const { result } = renderHook(() =>
      useChatEmoteLoader({ channelId: 'channel-1' }),
    );

    await waitFor(() => {
      expect(result.current.status).toBe('cancelled');
    });
    expect(mockPreloadGlobalEmotes).not.toHaveBeenCalled();
    expect(mockPreloadChannelEmotes).not.toHaveBeenCalled();
  });
});
