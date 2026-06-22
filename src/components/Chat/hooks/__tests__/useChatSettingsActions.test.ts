import { act, renderHook, waitFor } from '@testing-library/react-native';

import { clearCache } from '@app/store/chat/actions/channelLoad';
import { clearUserCosmeticsCache } from '@app/store/chat/actions/cosmetics';
import {
  getPreferences,
  replacePreferences,
} from '@app/store/preferences/state';
import { clearImageCache } from '@app/utils/image/clearImageCache';

import { useChatSettingsActions } from '../useChatSettingsActions';

jest.mock('@app/store/chat/actions/channelLoad', () => ({
  clearCache: jest.fn(),
}));

jest.mock('@app/store/chat/actions/cosmetics', () => ({
  clearUserCosmeticsCache: jest.fn(),
}));

jest.mock('@app/utils/image/clearImageCache', () => ({
  clearImageCache: jest.fn(() => Promise.resolve()),
}));

jest.mock('@app/utils/logger', () => ({
  logger: {
    chat: {
      error: jest.fn(),
      info: jest.fn(),
    },
  },
}));

const mockClearCache = jest.mocked(clearCache);
const mockClearImageCache = jest.mocked(clearImageCache);
const mockClearUserCosmeticsCache = jest.mocked(clearUserCosmeticsCache);

function renderSettingsActions() {
  const forceFlush = jest.fn();
  const joinChannel = jest.fn();
  const partChannel = jest.fn();
  const refetchEmotes = jest.fn(() => Promise.resolve());
  const reprocessAllMessages = jest.fn();
  const scrollToBottom = jest.fn();

  const updatePreferences = jest.fn((patch: Record<string, unknown>) => {
    replacePreferences({
      ...getPreferences(),
      ...patch,
    });
  });
  const hook = renderHook(() =>
    useChatSettingsActions({
      channelId: 'channel-1',
      channelName: 'foam',
      chatDensity: 'comfortable',
      forceFlush,
      joinChannel,
      partChannel,
      refetchEmotes,
      reprocessAllMessages,
      scrollToBottom,
      updatePreferences,
    }),
  );

  return {
    forceFlush,
    hook,
    joinChannel,
    partChannel,
    refetchEmotes,
    reprocessAllMessages,
    scrollToBottom,
  };
}

describe('useChatSettingsActions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    replacePreferences({
      ...getPreferences(),
      chatDensity: 'comfortable',
      chatTimestamps: true,
      highlightOwnMentions: true,
      showInlineReplyContext: true,
      showUnreadJumpPill: true,
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('clears chat, image, and 7TV cosmetic caches for the active channel', async () => {
    const { hook } = renderSettingsActions();

    act(() => {
      hook.result.current.handleClearChatCache();
      hook.result.current.handleClearSevenTvCosmeticsCache();
      hook.result.current.handleDebugClearImageCache();
    });

    await waitFor(() => {
      expect(mockClearImageCache).toHaveBeenCalledWith('channel-1');
    });
    expect(mockClearCache).toHaveBeenCalledWith('channel-1');
    expect(mockClearUserCosmeticsCache).toHaveBeenCalledTimes(1);
  });

  test('resume scroll flushes buffered chat before scrolling to the latest message', () => {
    const { forceFlush, hook, scrollToBottom } = renderSettingsActions();

    act(() => {
      hook.result.current.handleResumeScrollToBottom();
    });

    expect(forceFlush).toHaveBeenCalledTimes(1);
    expect(scrollToBottom).toHaveBeenCalledTimes(1);
    expect(forceFlush.mock.invocationCallOrder[0]).toBeLessThan(
      scrollToBottom.mock.invocationCallOrder[0] ?? Number.POSITIVE_INFINITY,
    );
  });

  test('settings refetch reloads emotes then reprocesses rendered messages', async () => {
    const { hook, refetchEmotes, reprocessAllMessages } =
      renderSettingsActions();

    act(() => {
      hook.result.current.handleSettingsRefetchEmotes();
    });

    await waitFor(() => {
      expect(refetchEmotes).toHaveBeenCalledTimes(1);
      expect(reprocessAllMessages).toHaveBeenCalledTimes(1);
    });
  });

  test('settings reconnect parts immediately and rejoins after the reconnect delay', () => {
    jest.useFakeTimers();
    const { hook, joinChannel, partChannel } = renderSettingsActions();

    act(() => {
      hook.result.current.handleSettingsReconnect();
    });

    expect(partChannel).toHaveBeenCalledWith('foam');
    expect(joinChannel).not.toHaveBeenCalled();

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(joinChannel).toHaveBeenCalledWith('foam');
  });

  test('preference toggles update the persisted chat settings', () => {
    const { hook } = renderSettingsActions();

    act(() => {
      hook.result.current.handleToggleChatDensity();
      hook.result.current.handleToggleHighlightOwnMentions(false);
      hook.result.current.handleToggleInlineReplyContext(false);
      hook.result.current.handleToggleShowTimestamps(false);
      hook.result.current.handleToggleShowUnreadJumpPill(false);
    });

    const preferences = getPreferences();

    expect({
      chatDensity: preferences.chatDensity,
      chatTimestamps: preferences.chatTimestamps,
      highlightOwnMentions: preferences.highlightOwnMentions,
      showInlineReplyContext: preferences.showInlineReplyContext,
      showUnreadJumpPill: preferences.showUnreadJumpPill,
    }).toEqual({
      chatDensity: 'compact',
      chatTimestamps: false,
      highlightOwnMentions: false,
      showInlineReplyContext: false,
      showUnreadJumpPill: false,
    });
  });
});
