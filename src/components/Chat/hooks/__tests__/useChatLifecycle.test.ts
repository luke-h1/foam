import { renderHook } from '@testing-library/react-native';

import * as channelLoadActions from '@app/store/chat/actions/channelLoad';
import * as cosmeticsActions from '@app/store/chat/actions/cosmetics';
import * as messagesActions from '@app/store/chat/actions/messages';
import * as personalEmotesActions from '@app/store/chat/actions/personalEmotes';
import * as userCosmeticsFetchActions from '@app/store/chat/actions/userCosmeticsFetch';
import { visibleAssetHydration } from '@app/store/chat/actions/visibleAssetHydration';

import { useChatLifecycle } from '../useChatLifecycle';

const abortCurrentLoad = jest.spyOn(channelLoadActions, 'abortCurrentLoad');
const clearChannelResources = jest.spyOn(
  channelLoadActions,
  'clearChannelResources',
);
// channelLoad re-exports this from personalEmotes.ts; babel compiles
// re-exports as non-configurable getters, so the spy must target the
// source module directly.
const clearPersonalEmotesCache = jest.spyOn(
  personalEmotesActions,
  'clearPersonalEmotesCache',
);
const clearMessages = jest.spyOn(messagesActions, 'clearMessages');
const clearPaintBindings = jest.spyOn(cosmeticsActions, 'clearPaintBindings');
const clearFetchedCosmeticsUsers = jest.spyOn(
  userCosmeticsFetchActions,
  'clearFetchedCosmeticsUsers',
);

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

  const getBeforeRemoveCb = () => beforeRemoveCb;

  beforeEach(() => {
    jest.clearAllMocks();
    defaultProps.isMountedRef.current = true;
    beforeRemoveCb = undefined;
    defaultNavigation.addListener.mockImplementation(
      (_event: string, cb: () => void) => {
        beforeRemoveCb = cb;
        return unsubscribe;
      },
    );
  });

  const defaultProps = {
    navigation: defaultNavigation,
    channelId: 'channel-1',
    channelName: 'testchannel',
    partChannel,
    clearLocalMessages,
    cleanupScroll,
    cleanupMessages,
    cancelEmoteLoad,
    isMountedRef: { current: true },
    processedMessageIdsRef: { current: new Set<string>() },
  };

  describe('return value', () => {
    test('returns refs for hasParted, initializedChannel, isMounted, currentEmoteSetId', () => {
      const { result } = renderHook(() => useChatLifecycle(defaultProps));

      expect(result.current.hasPartedRef).toBeDefined();
      expect(result.current.hasPartedRef.current).toBe(false);
      expect(result.current.initializedChannelRef).toBeDefined();
      expect(result.current.initializedChannelRef.current).toBe('channel-1');
      expect(result.current.isMountedRef).toBeDefined();
      expect(result.current.currentEmoteSetIdRef).toBeDefined();
      expect(result.current.currentEmoteSetIdRef.current).toBe(null);
    });
  });

  describe('navigation beforeRemove', () => {
    test('registers beforeRemove listener', () => {
      renderHook(() => useChatLifecycle(defaultProps));

      expect(defaultNavigation.addListener).toHaveBeenCalledWith(
        'beforeRemove',
        expect.any(Function),
      );
    });

    test('beforeRemove stops active work and parts without clearing rendered messages', () => {
      renderHook(() => useChatLifecycle(defaultProps));
      const cb = getBeforeRemoveCb();
      expect(cb).toBeDefined();
      cb?.();

      expect(abortCurrentLoad).toHaveBeenCalled();
      expect(cancelEmoteLoad).toHaveBeenCalled();
      expect(clearChannelResources).toHaveBeenCalled();
      expect(partChannel).toHaveBeenCalledWith('testchannel');
      expect(clearMessages).not.toHaveBeenCalled();
      expect(clearLocalMessages).toHaveBeenCalled();
      expect(defaultProps.isMountedRef.current).toBe(false);
    });

    test('beforeRemove only calls partChannel once (hasPartedRef guard)', () => {
      renderHook(() => useChatLifecycle(defaultProps));
      const cb = getBeforeRemoveCb();
      cb?.();
      cb?.();

      expect(partChannel).toHaveBeenCalledTimes(1);
    });
  });

  describe('cleanup on unmount', () => {
    test('unsubscribe and store cleanups are called when effect cleans up', () => {
      const { unmount } = renderHook(() => useChatLifecycle(defaultProps));

      unmount();

      expect(unsubscribe).toHaveBeenCalled();
      expect(abortCurrentLoad).toHaveBeenCalled();
      expect(cancelEmoteLoad).toHaveBeenCalled();
      expect(clearChannelResources).toHaveBeenCalled();
      expect(clearPaintBindings).toHaveBeenCalled();
      expect(clearPersonalEmotesCache).toHaveBeenCalled();
      expect(clearMessages).not.toHaveBeenCalled();
      expect(clearLocalMessages).toHaveBeenCalled();
      expect(cleanupScroll).toHaveBeenCalled();
      expect(cleanupMessages).toHaveBeenCalled();
    });

    test('clears the fetched-cosmetics session guard on unmount', () => {
      const { unmount } = renderHook(() => useChatLifecycle(defaultProps));

      expect(clearFetchedCosmeticsUsers).not.toHaveBeenCalled();

      unmount();

      expect(clearFetchedCosmeticsUsers).toHaveBeenCalledTimes(1);
    });
  });

  describe('channel init effect', () => {
    test('clears visible-asset dedup guards when the channel changes in place', () => {
      const { rerender } = renderHook(
        ({ channelId }: { channelId: string }) =>
          useChatLifecycle({ ...defaultProps, channelId }),
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

    test('clears processedMessageIdsRef on mount and sets initializedChannelRef', () => {
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
