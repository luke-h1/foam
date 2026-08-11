import { MutableRefObject, useEffect, useRef } from 'react';

import { useSyncRef } from '@app/hooks/useSyncRef';
import { useUnmountCallback } from '@app/hooks/useUnmountCallback';
import { resetChannelSession } from '@app/store/chat/actions/channelSession';
import { clearMentionSessionCaches } from '@app/store/chat/actions/chatColorCaches';

type PartChannel = (channelName: string) => void;

type NavigationLike = {
  addListener: (event: 'beforeRemove', cb: () => void) => () => void;
};

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
}: {
  navigation: NavigationLike;
  channelId: string;
  channelName: string;
  partChannel: PartChannel;
  clearLocalMessages: () => void;
  cleanupScroll: () => void;
  cleanupMessages: () => void;
  cancelEmoteLoad: () => void;
  isMountedRef: MutableRefObject<boolean>;
  processedMessageIdsRef: MutableRefObject<Set<string>>;
}) {
  const hasPartedRef = useRef(false);
  const initializedChannelRef = useRef<string | null>(null);
  const currentEmoteSetIdRef = useRef<string | null>(null);
  const lifecycleRef = useSyncRef({
    channelName,
    partChannel,
    clearLocalMessages,
    cleanupScroll,
    cleanupMessages,
    cancelEmoteLoad,
    processedMessageIdsRef,
  });

  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', () => {
      const lifecycle = lifecycleRef.current;
      lifecycle.cancelEmoteLoad();
      isMountedRef.current = false;
      resetChannelSession('leave');

      if (!hasPartedRef.current) {
        hasPartedRef.current = true;
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

  useUnmountCallback(() => {
    const lifecycle = lifecycleRef.current;
    isMountedRef.current = false;
    hasPartedRef.current = false;
    lifecycle.cancelEmoteLoad();
    resetChannelSession('unmount');
    lifecycle.processedMessageIdsRef.current.clear();
    lifecycle.clearLocalMessages();
    lifecycle.cleanupScroll();
    lifecycle.cleanupMessages();
    currentEmoteSetIdRef.current = null;
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
      clearMentionSessionCaches();
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

  return {
    hasPartedRef,
    initializedChannelRef,
    isMountedRef,
    currentEmoteSetIdRef,
  };
}
