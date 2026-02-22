import {
  abortCurrentLoad,
  clearChannelResources,
  clearMessages,
  clearPaints,
  clearPersonalEmotesCache,
  clearTtvUsers,
} from '@app/store/chatStore';
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

  useEffect(() => {
    const cosmeticsUsersSet = fetchedCosmeticsUsersRef.current;

    const unsubscribe = navigation.addListener('beforeRemove', () => {
      abortCurrentLoad();
      cancelEmoteLoad();
      isMountedRef.current = false;
      clearChannelResources();

      if (!hasPartedRef.current) {
        hasPartedRef.current = true;
        partChannel(channelName);
      }

      clearMessages();
      clearLocalMessages();
      initializedChannelRef.current = null;
      currentEmoteSetIdRef.current = null;
    });

    return () => {
      isMountedRef.current = false;
      hasPartedRef.current = false;
      abortCurrentLoad();
      cancelEmoteLoad();
      unsubscribe();
      clearChannelResources();
      clearTtvUsers();
      clearPaints();
      clearPersonalEmotesCache();
      cosmeticsUsersSet.clear();
      clearMessages();
      clearLocalMessages();
      cleanupScroll();
      cleanupMessages();
      currentEmoteSetIdRef.current = null;
    };
  }, [
    navigation,
    channelName,
    partChannel,
    clearLocalMessages,
    cleanupScroll,
    cleanupMessages,
    cancelEmoteLoad,
    fetchedCosmeticsUsersRef,
  ]);

  useEffect(() => {
    isMountedRef.current = true;
    hasPartedRef.current = false;
    currentEmoteSetIdRef.current = null;
    processedMessageIdsRef.current.clear();

    cleanupScroll();
    cleanupMessages();

    if (
      initializedChannelRef.current &&
      initializedChannelRef.current !== channelId
    ) {
      clearMessages();
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
  ]);

  return {
    hasPartedRef,
    initializedChannelRef,
    isMountedRef,
    currentEmoteSetIdRef,
  };
}
