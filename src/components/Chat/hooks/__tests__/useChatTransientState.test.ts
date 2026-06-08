import { act, renderHook } from '@testing-library/react-native';
import {
  useChatTransientState,
  useIsHighlightedReplyTargetMessage,
} from '@app/store/chat/react/transientState';

describe('useChatTransientState', () => {
  test('tracks hidden users, hidden phrases, highlighted users, and mention-only mode per channel', () => {
    const channelId = 'channel-transient-main';
    const { result } = renderHook(() => useChatTransientState(channelId));

    act(() => {
      result.current.hideUserFromView(' Viewer ');
      result.current.hidePhraseFromView(' Spoiler phrase ');
      result.current.toggleHighlightedUser('VIPUser');
      result.current.handleToggleShowOnlyMentions();
    });

    expect(result.current.hiddenUsers).toEqual(['viewer']);
    expect(result.current.hiddenPhrases).toEqual(['spoiler phrase']);
    expect(result.current.highlightedUsers).toEqual(['vipuser']);
    expect(result.current.showOnlyMentions).toBe(true);

    act(() => {
      result.current.toggleHighlightedUser('vipuser');
    });

    expect(result.current.highlightedUsers).toEqual([]);
  });

  test('keeps transient filters isolated by channel and clears the active channel', () => {
    const first = renderHook(() => useChatTransientState('channel-first'));
    const second = renderHook(() => useChatTransientState('channel-second'));

    act(() => {
      first.result.current.hideUserFromView('first-user');
      second.result.current.hideUserFromView('second-user');
      first.result.current.handleToggleShowOnlyMentions();
    });

    expect(first.result.current.hiddenUsers).toEqual(['first-user']);
    expect(first.result.current.showOnlyMentions).toBe(true);
    expect(second.result.current.hiddenUsers).toEqual(['second-user']);
    expect(second.result.current.showOnlyMentions).toBe(false);

    act(() => {
      first.result.current.handleClearFilters();
    });

    expect(first.result.current.hiddenUsers).toEqual([]);
    expect(first.result.current.showOnlyMentions).toBe(false);
    expect(second.result.current.hiddenUsers).toEqual(['second-user']);
  });

  test('exposes highlighted reply target as a fine-grained selector', () => {
    const channelId = 'channel-reply-target';
    const state = renderHook(() => useChatTransientState(channelId));
    const firstMessage = renderHook(() =>
      useIsHighlightedReplyTargetMessage(channelId, 'msg-1'),
    );
    const secondMessage = renderHook(() =>
      useIsHighlightedReplyTargetMessage(channelId, 'msg-2'),
    );

    expect(firstMessage.result.current).toBe(false);
    expect(secondMessage.result.current).toBe(false);

    act(() => {
      state.result.current.setHighlightedReplyTargetMessageId('msg-1');
    });

    expect(firstMessage.result.current).toBe(true);
    expect(secondMessage.result.current).toBe(false);

    act(() => {
      state.result.current.setHighlightedReplyTargetMessageId(current =>
        current === 'msg-1' ? 'msg-2' : current,
      );
    });

    expect(firstMessage.result.current).toBe(false);
    expect(secondMessage.result.current).toBe(true);
  });

  test('clears outstanding transient timers on unmount', () => {
    jest.useFakeTimers();
    const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');
    const { result, unmount } = renderHook(() =>
      useChatTransientState('channel-timers'),
    );
    const replyTimer = setTimeout(jest.fn(), 1000);
    const hydrationTimer = setTimeout(jest.fn(), 1000);
    result.current.highlightedReplyTargetTimeoutRef.current = replyTimer;
    result.current.visibleAssetHydrationTimerRef.current = hydrationTimer;

    unmount();

    expect(clearTimeoutSpy).toHaveBeenCalledWith(replyTimer);
    expect(clearTimeoutSpy).toHaveBeenCalledWith(hydrationTimer);
    expect(result.current.highlightedReplyTargetTimeoutRef.current).toBe(null);
    expect(result.current.visibleAssetHydrationTimerRef.current).toBe(null);

    clearTimeoutSpy.mockRestore();
    jest.useRealTimers();
  });
});
