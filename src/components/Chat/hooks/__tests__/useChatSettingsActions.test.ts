import { act, renderHook, waitFor } from '@testing-library/react-native';

import * as channelLoadActions from '@app/store/chat/actions/channelLoad';
import * as cosmeticsActions from '@app/store/chat/actions/cosmetics';
import { getPreferences, replacePreferences } from '@app/store/preferenceStore';
import * as clearImageCacheModule from '@app/utils/image/clearImageCache';
import { logger } from '@app/utils/logger';

import { useChatSettingsActions } from '../useChatSettingsActions';

const mockClearCache = jest.spyOn(channelLoadActions, 'clearCache');
const mockInvalidateChatResourceCaches = jest.spyOn(
  channelLoadActions,
  'invalidateChatResourceCaches',
);
const mockClearImageCache = jest
  .spyOn(clearImageCacheModule, 'clearImageCache')
  .mockResolvedValue(undefined);
const mockClearUserCosmeticsCache = jest.spyOn(
  cosmeticsActions,
  'clearUserCosmeticsCache',
);

jest.spyOn(logger.chat, 'error').mockImplementation(() => {});
jest.spyOn(logger.chat, 'info').mockImplementation(() => {});

function renderSettingsActions() {
  const forceFlush = jest.fn();
  const joinChannel = jest.fn();
  const partChannel = jest.fn();
  const refetchEmotes = jest.fn(() => Promise.resolve());
  const reprocessAllMessages = jest.fn();
  const scrollToBottom = jest.fn();

  const hook = renderHook(() =>
    useChatSettingsActions({
      channelId: 'channel-1',
      channelName: 'foam',
      forceFlush,
      joinChannel,
      partChannel,
      refetchEmotes,
      reprocessAllMessages,
      scrollToBottom,
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
      hook.result.current.handleClearImageCache();
    });

    await waitFor(() => {
      expect(mockClearImageCache).toHaveBeenCalledTimes(1);
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

  test('refreshing emotes and badges invalidates every cache, reloads, then reprocesses rendered messages', async () => {
    const { hook, refetchEmotes, reprocessAllMessages } =
      renderSettingsActions();

    act(() => {
      hook.result.current.handleRefreshEmotesAndBadges();
    });

    await waitFor(() => {
      expect(refetchEmotes).toHaveBeenCalledTimes(1);
      expect(reprocessAllMessages).toHaveBeenCalledTimes(1);
    });
    expect(mockInvalidateChatResourceCaches).toHaveBeenCalledWith('channel-1');
    expect(mockClearImageCache).toHaveBeenCalledTimes(1);
    expect(mockClearUserCosmeticsCache).toHaveBeenCalledTimes(1);
    // Stale-stamped, not deleted: the cached slices must survive as the
    // fallback if a provider fetch fails during the reload.
    expect(mockClearCache).not.toHaveBeenCalled();
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
});
