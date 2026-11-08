import { type MutableRefObject, useEffect, useRef } from 'react';

import { useSyncRef } from '@app/hooks/use-sync-ref';
import { useUnmountCallback } from '@app/hooks/use-unmount-callback';
import { resetChannelSession } from '@app/store/chat/actions/channel-session';

type PartChannel = (channelName: string) => void;

interface UseChatLifecycleOptions {
  navigation: {
    addListener: (event: 'beforeRemove', cb: () => void) => () => void;
  };
  channelId: string;
  channelName: string;
  partChannel: PartChannel;
  clearLocalMessages: () => void;
  cleanupScroll: () => void;
  cleanupMessages: () => void;
  cancelEmoteLoad: () => void;
  isMountedRef: MutableRefObject<boolean>;
  processedMessageIdsRef: MutableRefObject<Set<string>>;
}

export function useChatLifecycle({
  navigation,
  channelId,
  channelName,
  partChannel,
  clearLocalMessages,
  cleanupScroll,
  cleanupMessages,
  cancelEmoteLoad,
  isMountedRef,
  processedMessageIdsRef,
}: UseChatLifecycleOptions) {
  const hasPartedRef = useRef(false);
  const initializedChannelRef = useRef<string | null>(null);
  const currentEmoteSetIdRef = useRef<string | null>(null);

  const lifecycleRef = useSyncRef({
    channelName,
    partChannel,
    clearLocalMessages,
    cancelEmoteLoad,
    processedMessageIdsRef,
  });

  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', () => {
      const lifecycle = lifecycleRef.current;
      lifecycle.cancelEmoteLoad();
      isMountedRef.current = false;

      if (!hasPartedRef.current) {
        hasPartedRef.current = true;
        resetChannelSession('leave');
        lifecycle.partChannel(lifecycle.channelName);
      }

      lifecycle.clearLocalMessages();
      initializedChannelRef.current = null;
      currentEmoteSetIdRef.current = null;
    });

    return () => {
      unsubscribe();
    };
  }, [navigation, lifecycleRef, isMountedRef]);

  // The channel effect cleanup below also runs on unmount and resets the scroll, the buffers and the flags.
  useUnmountCallback(() => {
    const lifecycle = lifecycleRef.current;
    lifecycle.cancelEmoteLoad();
    resetChannelSession('unmount');
    lifecycle.processedMessageIdsRef.current.clear();
    lifecycle.clearLocalMessages();
  });

  useEffect(() => {
    const processedMessageIds = processedMessageIdsRef.current;

    isMountedRef.current = true;
    hasPartedRef.current = false;
    currentEmoteSetIdRef.current = null;
    processedMessageIds.clear();

    cleanupScroll();
    cleanupMessages();

    if (
      initializedChannelRef.current &&
      initializedChannelRef.current !== channelId
    ) {
      resetChannelSession('switch');
      clearLocalMessages();
    }

    initializedChannelRef.current = channelId;

    return () => {
      isMountedRef.current = false;
      hasPartedRef.current = false;
      currentEmoteSetIdRef.current = null;
      cleanupScroll();
      cleanupMessages();
    };
  }, [
    channelId,
    clearLocalMessages,
    cleanupScroll,
    cleanupMessages,
    processedMessageIdsRef,
    isMountedRef,
  ]);

  return { currentEmoteSetIdRef };
}
