import { useUnmountCallback } from '@app/hooks/useUnmountCallback';
import { useSyncRef } from '@app/hooks/useSyncRef';
import {
  abortCurrentLoad,
  clearChannelResources,
  clearPersonalEmotesCache,
} from '@app/store/chatStore/channelLoad';
import { clearPaints } from '@app/store/chatStore/cosmetics';
import { clearMessages, clearTtvUsers } from '@app/store/chatStore/messages';
import { clearMentionSessionCaches } from '@app/store/chatStore/chatColorCaches';
import { resetMentionLoginResolver } from '@app/utils/chat/mentionLoginResolver';
import { MutableRefObject, useEffect, useRef } from 'react';

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
  fetchedCosmeticsUsersRef,
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
  fetchedCosmeticsUsersRef: MutableRefObject<Set<string>>;
  processedMessageIdsRef: MutableRefObject<Set<string>>;
}) {
  const hasPartedRef = useRef(false);
  const initializedChannelRef = useRef<string | null>(null);
  const isMountedRef = useRef(true);
  const currentEmoteSetIdRef = useRef<string | null>(null);
  const lifecycleRef = useSyncRef({
    channelName,
    partChannel,
    clearLocalMessages,
    cleanupScroll,
    cleanupMessages,
    cancelEmoteLoad,
    fetchedCosmeticsUsersRef,
    processedMessageIdsRef,
  });

  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', () => {
      const lifecycle = lifecycleRef.current;
      abortCurrentLoad();
      lifecycle.cancelEmoteLoad();
      isMountedRef.current = false;
      clearChannelResources();

      if (!hasPartedRef.current) {
        hasPartedRef.current = true;
        lifecycle.partChannel(lifecycle.channelName);
      }

      clearMessages();
      clearMentionSessionCaches();
      lifecycle.clearLocalMessages();
      initializedChannelRef.current = null;
      currentEmoteSetIdRef.current = null;
    });

    return () => {
      unsubscribe();
    };
  }, [navigation, lifecycleRef]);

  useUnmountCallback(() => {
    const lifecycle = lifecycleRef.current;
    isMountedRef.current = false;
    hasPartedRef.current = false;
    abortCurrentLoad();
    lifecycle.cancelEmoteLoad();
    clearChannelResources();
    clearTtvUsers();
    clearPaints();
    clearPersonalEmotesCache();
    lifecycle.fetchedCosmeticsUsersRef.current.clear();
    lifecycle.processedMessageIdsRef.current.clear();
    clearMessages();
    clearMentionSessionCaches();
    resetMentionLoginResolver();
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
      clearMessages();
      clearMentionSessionCaches();
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
  ]);

  return {
    hasPartedRef,
    initializedChannelRef,
    isMountedRef,
    currentEmoteSetIdRef,
  };
}
