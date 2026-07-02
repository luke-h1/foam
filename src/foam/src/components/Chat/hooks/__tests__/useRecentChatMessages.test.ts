import { renderHook, waitFor } from '@testing-library/react-native';

import { recentMessagesService } from '@app/services/recent-messages-service';
import { restoreRecentMessagesForChannel } from '@app/store/chat/actions/messages';
import { chatStore$ } from '@app/store/chat/observables/chatStore';

import { useRecentChatMessages } from '../useRecentChatMessages';

jest.mock('@app/services/recent-messages-service', () => ({
  recentMessagesService: {
    getRecentMessages: jest.fn(),
  },
}));

jest.mock('@app/store/chat/actions/messages', () => ({
  restoreRecentMessagesForChannel: jest.fn(),
}));

jest.mock('@app/store/chat/observables/chatStore', () => ({
  chatStore$: {
    currentChannelId: {
      set: jest.fn(),
    },
  },
}));

jest.mock('@app/utils/logger', () => ({
  logger: {
    chat: {
      debug: jest.fn(),
    },
  },
}));

const mockGetRecentMessages = jest.mocked(
  recentMessagesService.getRecentMessages,
);
const mockRestoreRecentMessagesForChannel = jest.mocked(
  restoreRecentMessagesForChannel,
);
const mockSetCurrentChannelId = jest.mocked(chatStore$.currentChannelId.set);

function renderRecentMessages({
  channelId = 'channel-1',
  channelName = 'foam',
  showRecentMessages = true,
}: {
  channelId?: string;
  channelName?: string;
  showRecentMessages?: boolean;
} = {}) {
  const forceFlush = jest.fn();
  const isLoadingRecentMessagesRef = { current: false };
  const processRecentIrcLine = jest.fn(() => Promise.resolve());
  const scrollChatToEnd = jest.fn();

  const hook = renderHook(() =>
    useRecentChatMessages({
      channelId,
      channelName,
      forceFlush,
      processRecentIrcLine,
      isLoadingRecentMessagesRef,
      scrollChatToEnd,
      showRecentMessages,
    }),
  );

  return {
    forceFlush,
    hook,
    isLoadingRecentMessagesRef,
    processRecentIrcLine,
    scrollChatToEnd,
  };
}

describe('useRecentChatMessages', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRestoreRecentMessagesForChannel.mockReturnValue(0);
    mockGetRecentMessages.mockResolvedValue([]);
  });

  test('sets the current channel and restores cached messages on channel changes', () => {
    mockRestoreRecentMessagesForChannel.mockReturnValue(4);

    renderRecentMessages({ showRecentMessages: false });

    expect(mockSetCurrentChannelId).toHaveBeenCalledWith('channel-1');
    expect(mockRestoreRecentMessagesForChannel).toHaveBeenCalledWith(
      'channel-1',
    );
  });

  test('when recent fetch is disabled, restored messages scroll to the latest cached row', () => {
    mockRestoreRecentMessagesForChannel.mockReturnValue(3);

    const { isLoadingRecentMessagesRef, scrollChatToEnd } =
      renderRecentMessages({ showRecentMessages: false });

    expect(scrollChatToEnd).toHaveBeenCalledTimes(1);
    expect(isLoadingRecentMessagesRef.current).toBe(false);
    expect(mockGetRecentMessages).not.toHaveBeenCalled();
  });

  test('replays fetched IRC lines in order, then flushes and scrolls', async () => {
    mockGetRecentMessages.mockResolvedValue(['line-1', 'line-2', 'line-3']);
    const { forceFlush, isLoadingRecentMessagesRef, processRecentIrcLine } =
      renderRecentMessages();

    expect(isLoadingRecentMessagesRef.current).toBe(true);

    await waitFor(() => {
      expect(processRecentIrcLine.mock.calls).toEqual([
        ['line-1'],
        ['line-2'],
        ['line-3'],
      ]);
      expect(forceFlush).toHaveBeenCalledTimes(1);
    });
    expect(isLoadingRecentMessagesRef.current).toBe(false);
  });

  test('aborts in-flight recent history load on unmount without clearing the loading flag late', async () => {
    let abortSignal: AbortSignal | undefined;
    mockGetRecentMessages.mockImplementation((_channel, signal) => {
      abortSignal = signal;
      return new Promise<string[]>(() => {});
    });
    const { hook, isLoadingRecentMessagesRef } = renderRecentMessages();

    expect(isLoadingRecentMessagesRef.current).toBe(true);

    hook.unmount();

    expect(abortSignal?.aborted).toBe(true);
    expect(isLoadingRecentMessagesRef.current).toBe(false);
  });
});
