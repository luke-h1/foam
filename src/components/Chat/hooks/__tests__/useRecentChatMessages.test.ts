import { renderHook, waitFor } from '@testing-library/react-native';

import { createChatMessage } from '@app/components/Chat/hooks/__tests__/__fixtures__/useChat.fixture';
import { recentMessagesService } from '@app/services/recent-messages-service';
import { clearMessages } from '@app/store/chat/actions/messages';
import { chatStore$ } from '@app/store/chat/observables/chatStore';
import { logger } from '@app/utils/logger';

import { useRecentChatMessages } from '../useRecentChatMessages';

jest.spyOn(logger.chat, 'debug').mockImplementation(() => {});

const mockGetRecentMessages = jest
  .spyOn(recentMessagesService, 'getRecentMessages')
  .mockResolvedValue([]);

/**
 * Seeds the real recent-messages cache the hook reads through
 * `restoreRecentMessagesForChannel`, rather than mocking the store action.
 */
function seedRecentMessages(channelId: string, count: number): void {
  chatStore$.recentMessagesByChannel[channelId]?.set(
    Array.from({ length: count }, (_unused, index) =>
      createChatMessage({
        tags: { id: `recent-${index}`, login: 'chatter' },
        text: `recent ${index}`,
      }),
    ),
  );
}

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
    mockGetRecentMessages.mockResolvedValue([]);
    clearMessages();
    chatStore$.currentChannelId.set('');
    chatStore$.recentMessagesByChannel['channel-1']?.set([]);
  });

  test('sets the current channel and restores cached messages on channel changes', () => {
    seedRecentMessages('channel-1', 4);

    renderRecentMessages({ showRecentMessages: false });

    expect(chatStore$.currentChannelId.peek()).toBe('channel-1');
    expect(chatStore$.messages.peek()).toHaveLength(4);
  });

  test('when recent fetch is disabled, restored messages scroll to the latest cached row', () => {
    seedRecentMessages('channel-1', 3);

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
