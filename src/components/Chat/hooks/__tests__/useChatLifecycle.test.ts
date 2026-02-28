import {
  abortCurrentLoad,
  clearChannelResources,
  clearPersonalEmotesCache,
} from '@app/store/chatStore/channelLoad';
import { clearPaints } from '@app/store/chatStore/cosmetics';
import { clearMessages, clearTtvUsers } from '@app/store/chatStore/messages';
import { renderHook } from '@testing-library/react-native';
import { useChatLifecycle } from '../useChatLifecycle';

jest.mock('@app/store/chatStore/channelLoad', () => ({
  abortCurrentLoad: jest.fn(),
  clearChannelResources: jest.fn(),
  clearPersonalEmotesCache: jest.fn(),
}));
jest.mock('@app/store/chatStore/messages', () => ({
  clearMessages: jest.fn(),
  clearTtvUsers: jest.fn(),
}));
jest.mock('@app/store/chatStore/cosmetics', () => ({
  clearPaints: jest.fn(),
}));

describe('useChatLifecycle', () => {
  const partChannel = jest.fn();
  const clearLocalMessages = jest.fn();
  const cleanupScroll = jest.fn();
  const cleanupMessages = jest.fn();
  const cancelEmoteLoad = jest.fn();
  const unsubscribe = jest.fn();

  const defaultNavigation = {
    addListener: jest.fn((_event: string, cb: () => void) => {
      (defaultNavigation as { beforeRemoveCb?: () => void }).beforeRemoveCb =
        cb;
      return unsubscribe;
    }),
  };

  const getBeforeRemoveCb = () =>
    (defaultNavigation as { beforeRemoveCb?: () => void }).beforeRemoveCb;

  beforeEach(() => {
    jest.clearAllMocks();
    (defaultNavigation.addListener as jest.Mock).mockImplementation(
      (_event: string, cb: () => void) => {
        (defaultNavigation as { beforeRemoveCb?: () => void }).beforeRemoveCb =
          cb;
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
    fetchedCosmeticsUsersRef: { current: new Set<string>() },
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

    test('beforeRemove calls abortCurrentLoad, cancelEmoteLoad, clearChannelResources, partChannel, clearMessages, clearLocalMessages', () => {
      renderHook(() => useChatLifecycle(defaultProps));
      const cb = getBeforeRemoveCb();
      expect(cb).toBeDefined();
      cb?.();

      expect(abortCurrentLoad).toHaveBeenCalled();
      expect(cancelEmoteLoad).toHaveBeenCalled();
      expect(clearChannelResources).toHaveBeenCalled();
      expect(partChannel).toHaveBeenCalledWith('testchannel');
      expect(clearMessages).toHaveBeenCalled();
      expect(clearLocalMessages).toHaveBeenCalled();
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
      expect(clearTtvUsers).toHaveBeenCalled();
      expect(clearPaints).toHaveBeenCalled();
      expect(clearPersonalEmotesCache).toHaveBeenCalled();
      expect(clearMessages).toHaveBeenCalled();
      expect(clearLocalMessages).toHaveBeenCalled();
      expect(cleanupScroll).toHaveBeenCalled();
      expect(cleanupMessages).toHaveBeenCalled();
    });

    test('clears cosmetics set from fetchedCosmeticsUsersRef', () => {
      const cosmeticsSet = new Set<string>(['user1', 'user2']);
      const ref = { current: cosmeticsSet };
      const { unmount } = renderHook(() =>
        useChatLifecycle({ ...defaultProps, fetchedCosmeticsUsersRef: ref }),
      );

      unmount();

      expect(cosmeticsSet.size).toBe(0);
    });
  });

  describe('channel init effect', () => {
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
