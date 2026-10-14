import { act, renderHook, waitFor } from '@testing-library/react-native';

import { useChatSettingsActions } from '@app/components/chat/hooks/use-chat-settings-actions';
import { clearMessages } from '@app/store/chat/actions/messages';
import { chatStore$ } from '@app/store/chat/observables/chat-store';
import { makeEmptyEmoteData } from '@app/store/chat/types/constants';
import {
  getPreferences,
  replacePreferences,
} from '@app/store/preference-store';
import * as clearImageCacheModule from '@app/utils/image/clear-image-cache';
import { logger } from '@app/utils/logger';

const mockClearImageCache = jest
  .spyOn(clearImageCacheModule, 'clearImageCache')
  .mockResolvedValue(undefined);

jest.spyOn(logger.chat, 'error').mockImplementation(() => {});
jest.spyOn(logger.chat, 'info').mockImplementation(() => {});

interface ChannelCacheStamps {
  badgesLastUpdated: number | undefined;
  lastUpdated: number;
}

interface ChatCacheState {
  channelStamps: Record<string, ChannelCacheStamps>;
  cosmeticsVersionBumps: number;
  currentChannelId: string | null;
  userBadgeIds: Record<string, string>;
  userPaintIds: Record<string, string>;
}

let seededCosmeticsVersion = 0;

function seedChatCaches() {
  chatStore$.persisted.channelCaches.set({
    'channel-1': {
      ...makeEmptyEmoteData(),
      badgesLastUpdated: 2000,
      lastUpdated: 1000,
    },
    'channel-2': {
      ...makeEmptyEmoteData(),
      badgesLastUpdated: 4000,
      lastUpdated: 3000,
    },
  });

  chatStore$.currentChannelId.set('channel-1');
  chatStore$.userPaintIds.set({ 'viewer-1': 'paint-1' });
  chatStore$.userBadgeIds.set({ 'viewer-1': 'badge-1' });
  seededCosmeticsVersion = chatStore$.cosmeticsCacheVersion.peek();
}

function readChatCaches(): ChatCacheState {
  const caches = chatStore$.persisted.channelCaches.peek() ?? {};

  return {
    channelStamps: Object.fromEntries(
      Object.entries(caches).map(([channelId, cache]) => [
        channelId,
        {
          badgesLastUpdated: cache.badgesLastUpdated,
          lastUpdated: cache.lastUpdated,
        },
      ]),
    ),
    cosmeticsVersionBumps:
      chatStore$.cosmeticsCacheVersion.peek() - seededCosmeticsVersion,
    currentChannelId: chatStore$.currentChannelId.peek(),
    userBadgeIds: { ...chatStore$.userBadgeIds.peek() },
    userPaintIds: { ...chatStore$.userPaintIds.peek() },
  };
}

function systemMessageContents(): (string | undefined)[] {
  return chatStore$.messages
    .peek()
    .filter(message => message.sender === 'System')
    .map(message =>
      message.message[0] && 'content' in message.message[0]
        ? message.message[0].content
        : undefined,
    );
}

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
    clearMessages();
    seedChatCaches();

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

  test('clearing the chat cache drops only the active channel cache', () => {
    const { hook } = renderSettingsActions();

    act(() => {
      hook.result.current.handleClearChatCache();
    });

    expect(readChatCaches()).toEqual<ChatCacheState>({
      channelStamps: {
        'channel-2': { badgesLastUpdated: 4000, lastUpdated: 3000 },
      },
      cosmeticsVersionBumps: 1,
      currentChannelId: null,
      userBadgeIds: { 'viewer-1': 'badge-1' },
      userPaintIds: { 'viewer-1': 'paint-1' },
    });
  });

  test('clearing the 7TV cosmetics cache drops every paint and badge binding', () => {
    const { hook } = renderSettingsActions();

    act(() => {
      hook.result.current.handleClearSevenTvCosmeticsCache();
    });

    expect(readChatCaches()).toEqual<ChatCacheState>({
      channelStamps: {
        'channel-1': { badgesLastUpdated: 2000, lastUpdated: 1000 },
        'channel-2': { badgesLastUpdated: 4000, lastUpdated: 3000 },
      },
      cosmeticsVersionBumps: 1,
      currentChannelId: 'channel-1',
      userBadgeIds: {},
      userPaintIds: {},
    });
  });

  test('clearing the image cache clears the image cache once', async () => {
    const { hook } = renderSettingsActions();

    act(() => {
      hook.result.current.handleClearImageCache();
    });

    await waitFor(() => {
      expect(mockClearImageCache).toHaveBeenCalledTimes(1);
    });
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

    expect(mockClearImageCache).toHaveBeenCalledTimes(1);

    // Stale-stamped, not deleted: the cached slices must survive as the
    // fallback if a provider fetch fails during the reload.
    expect(readChatCaches()).toEqual<ChatCacheState>({
      channelStamps: {
        'channel-1': { badgesLastUpdated: 0, lastUpdated: 0 },
        'channel-2': { badgesLastUpdated: 4000, lastUpdated: 3000 },
      },
      cosmeticsVersionBumps: 1,
      currentChannelId: 'channel-1',
      userBadgeIds: {},
      userPaintIds: {},
    });

    expect(systemMessageContents()).toEqual(['Refreshed emotes and badges']);
  });

  test('settings reconnect tokens immediately and rejoins after the reconnect delay', () => {
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
