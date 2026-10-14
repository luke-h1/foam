import { renderHook } from '@testing-library/react-native';

import {
  createChatMessage,
  createSevenTvEmote,
} from '@app/components/chat/hooks/__tests__/__fixtures__/use-chat.fixture';
import { useChatLifecycle } from '@app/components/chat/hooks/use-chat-lifecycle';
import { sevenTvService } from '@app/services/seven-tv-service';
import { startChannelLoadAbort } from '@app/store/chat/actions/channel-load';
import {
  clearSessionCache,
  getSessionCacheString,
  setSessionCacheString,
} from '@app/store/chat/actions/chat-color-caches';
import {
  clearUserCosmeticsCache,
  setUserPaint,
} from '@app/store/chat/actions/cosmetics';
import { addMessages, clearMessages } from '@app/store/chat/actions/messages';
import {
  clearPersonalEmotesCache,
  fetchUserPersonalEmotes,
  getUserPersonalEmotes,
} from '@app/store/chat/actions/personal-emotes';
import {
  clearFetchedCosmeticsUsers,
  fetchUserCosmetics,
} from '@app/store/chat/actions/user-cosmetics-fetch';
import {
  clearVisibleAssetHydration,
  visibleAssetHydration,
} from '@app/store/chat/actions/visible-asset-hydration';
import { chatStore$ } from '@app/store/chat/observables/chat-store';

interface ChannelSessionState {
  currentChannelId: string | null;
  loadingState: string;
  loadAborted: boolean;
  messageIds: string[];
  mentionColor: string | undefined;
  userPaintIds: Record<string, string>;
  personalEmoteIds: string[];
  otherChannelPersonalEmoteIds: string[];
  hydratedMessageKeys: number;
}

const channelId = 'channel-1';
const otherChannelId = 'channel-2';
const personalEmote = createSevenTvEmote({ id: 'personal-1', name: 'Mine' });

let loadController: AbortController;

let get7tvUserId: jest.SpiedFunction<typeof sevenTvService.get7tvUserId>;

/**
 * Seeds the module and store state that a channel session builds up while
 * the user watches a channel.
 */
async function seedChannelSession() {
  chatStore$.currentChannelId.set(channelId);
  chatStore$.loadingState.set('COMPLETED');
  loadController = startChannelLoadAbort();

  addMessages([createChatMessage({ overrides: { message_id: 'm1' } })]);
  setSessionCacheString('mentionColors', 'luke', '#ff0000');
  setUserPaint('ttv-1', 'paint-1');
  visibleAssetHydration.hydratedMessageKeys.add('m1');

  jest
    .spyOn(sevenTvService, 'getPersonalEmoteSet')
    .mockResolvedValueOnce([personalEmote])
    .mockResolvedValueOnce([personalEmote]);

  await fetchUserPersonalEmotes('ttv-1', channelId);
  await fetchUserPersonalEmotes('ttv-3', otherChannelId);
  await fetchUserCosmetics('ttv-2');
}

function readChannelSession(): ChannelSessionState {
  return {
    currentChannelId: chatStore$.currentChannelId.peek(),
    loadingState: chatStore$.loadingState.peek(),
    loadAborted: loadController.signal.aborted,
    messageIds: chatStore$.messages.peek().map(message => message.message_id),
    mentionColor: getSessionCacheString('mentionColors', 'luke'),
    userPaintIds: chatStore$.userPaintIds.peek(),
    personalEmoteIds: getUserPersonalEmotes('ttv-1', channelId).map(
      emote => emote.id,
    ),
    otherChannelPersonalEmoteIds: getUserPersonalEmotes(
      'ttv-3',
      otherChannelId,
    ).map(emote => emote.id),
    hydratedMessageKeys: visibleAssetHydration.hydratedMessageKeys.size,
  };
}

describe('useChatLifecycle', () => {
  const partChannel = jest.fn();
  const clearLocalMessages = jest.fn();
  const cleanupScroll = jest.fn();
  const cleanupMessages = jest.fn();
  const cancelEmoteLoad = jest.fn();
  const unsubscribe = jest.fn();

  let beforeRemoveCb: (() => void) | undefined;

  const defaultNavigation = {
    addListener: jest.fn((_event: string, cb: () => void) => {
      beforeRemoveCb = cb;
      return unsubscribe;
    }),
  };

  const runBeforeRemove = () => {
    if (!beforeRemoveCb) {
      throw new Error('useChatLifecycle did not add a beforeRemove listener');
    }

    beforeRemoveCb();
  };

  const defaultProps = {
    navigation: defaultNavigation,
    channelId,
    channelName: 'testchannel',
    partChannel,
    clearLocalMessages,
    cleanupScroll,
    cleanupMessages,
    cancelEmoteLoad,
    isMountedRef: { current: true },
    processedMessageIdsRef: { current: new Set<string>() },
  };

  beforeEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
    clearMessages();
    clearSessionCache();
    clearUserCosmeticsCache();
    clearPersonalEmotesCache();
    clearFetchedCosmeticsUsers();
    clearVisibleAssetHydration();
    defaultProps.isMountedRef.current = true;
    beforeRemoveCb = undefined;
    get7tvUserId = jest
      .spyOn(sevenTvService, 'get7tvUserId')
      .mockResolvedValue('');

    defaultNavigation.addListener.mockImplementation(
      (_event: string, cb: () => void) => {
        beforeRemoveCb = cb;
        return unsubscribe;
      },
    );
  });

  afterEach(() => {
    clearUserCosmeticsCache();
  });

  describe('return value', () => {
    test('starts with no part, the mounted channel and no emote set', () => {
      const { result } = renderHook(() => useChatLifecycle(defaultProps));

      expect({
        hasParted: result.current.hasPartedRef.current,
        initializedChannel: result.current.initializedChannelRef.current,
        isMounted: result.current.isMountedRef.current,
        currentEmoteSetId: result.current.currentEmoteSetIdRef.current,
      }).toEqual({
        hasParted: false,
        initializedChannel: channelId,
        isMounted: true,
        currentEmoteSetId: null,
      });
    });
  });

  describe('navigation beforeRemove', () => {
    test('leaving clears this channel but keeps messages and paint bindings', async () => {
      renderHook(() => useChatLifecycle(defaultProps));
      await seedChannelSession();

      runBeforeRemove();

      expect(readChannelSession()).toEqual<ChannelSessionState>({
        currentChannelId: null,
        loadingState: 'IDLE',
        loadAborted: true,
        messageIds: ['m1'],
        mentionColor: undefined,
        userPaintIds: { 'ttv-1': 'paint-1' },
        personalEmoteIds: [],
        otherChannelPersonalEmoteIds: ['personal-1'],
        hydratedMessageKeys: 1,
      });

      expect(partChannel.mock.calls).toEqual([['testchannel']]);
      expect(cancelEmoteLoad).toHaveBeenCalledTimes(1);
      expect(clearLocalMessages).toHaveBeenCalledTimes(1);
      expect(defaultProps.isMountedRef.current).toBe(false);
    });

    test('beforeRemove only calls partChannel once (hasPartedRef guard)', () => {
      renderHook(() => useChatLifecycle(defaultProps));

      runBeforeRemove();
      runBeforeRemove();

      expect(partChannel).toHaveBeenCalledTimes(1);
    });
  });

  describe('cleanup on unmount', () => {
    test('unmount clears the channel session but keeps rendered messages', async () => {
      const { unmount } = renderHook(() => useChatLifecycle(defaultProps));
      await seedChannelSession();
      cleanupScroll.mockClear();
      cleanupMessages.mockClear();

      unmount();

      expect(readChannelSession()).toEqual<ChannelSessionState>({
        currentChannelId: null,
        loadingState: 'IDLE',
        loadAborted: true,
        messageIds: ['m1'],
        mentionColor: undefined,
        userPaintIds: {},
        personalEmoteIds: [],
        otherChannelPersonalEmoteIds: [],
        hydratedMessageKeys: 0,
      });

      expect(unsubscribe).toHaveBeenCalledTimes(1);
      expect(cancelEmoteLoad).toHaveBeenCalledTimes(1);
      expect(clearLocalMessages).toHaveBeenCalledTimes(1);
      expect(cleanupScroll).toHaveBeenCalledTimes(2);
      expect(cleanupMessages).toHaveBeenCalledTimes(2);
    });

    test('requests a chatter cosmetics again after unmount', async () => {
      const { unmount } = renderHook(() => useChatLifecycle(defaultProps));

      await fetchUserCosmetics('ttv-2');
      await fetchUserCosmetics('ttv-2');

      expect(get7tvUserId.mock.calls).toEqual([['ttv-2']]);

      unmount();
      await fetchUserCosmetics('ttv-2');

      expect(get7tvUserId.mock.calls).toEqual([['ttv-2'], ['ttv-2']]);
    });
  });

  describe('channel init effect', () => {
    test('clears visible-asset dedup guards when the channel changes in place', () => {
      const { rerender } = renderHook(
        ({ channelId: id }: { channelId: string }) =>
          useChatLifecycle({ ...defaultProps, channelId: id }),
        { initialProps: { channelId: 'channel-a' } },
      );

      visibleAssetHydration.personalEmoteUsers.add('user-1');
      visibleAssetHydration.cosmeticUsers.add('user-2');
      visibleAssetHydration.hydratedMessageKeys.add('key-1');

      rerender({ channelId: 'channel-a' });
      expect(visibleAssetHydration.personalEmoteUsers.size).toBe(1);

      rerender({ channelId: 'channel-b' });

      expect(visibleAssetHydration.personalEmoteUsers.size).toBe(0);
      expect(visibleAssetHydration.cosmeticUsers.size).toBe(0);
      expect(visibleAssetHydration.hydratedMessageKeys.size).toBe(0);
    });

    test('clears the messages when the channel changes in place', () => {
      const { rerender } = renderHook(
        ({ channelId: id }: { channelId: string }) =>
          useChatLifecycle({ ...defaultProps, channelId: id }),
        { initialProps: { channelId: 'channel-a' } },
      );

      addMessages([createChatMessage({ overrides: { message_id: 'm1' } })]);
      rerender({ channelId: 'channel-b' });

      expect(chatStore$.messages.peek()).toEqual([]);
    });

    test('clears processedMessageIdsRef on mount', () => {
      const processedRef = { current: new Set<string>(['id1']) };

      renderHook(() =>
        useChatLifecycle({
          ...defaultProps,
          processedMessageIdsRef: processedRef,
        }),
      );

      expect(processedRef.current.size).toBe(0);
    });
  });
});
