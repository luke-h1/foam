import { useAuthContext } from '@app/context/AuthContext';
import {
  loadChannelResources,
  getSevenTvEmoteSetId,
} from '@app/store/chatStore';
import { logger } from '@app/utils/logger';
import { RefObject, useCallback, useEffect, useRef } from 'react';

const MAX_CONNECTION_RETRIES = 100;
const RETRY_INTERVAL_MS = 100;

interface UseEmoteResourceLoaderOptions {
  channelId: string;
  accessToken: string | undefined;
  isChatConnected: () => boolean;
  isMountedRef: RefObject<boolean>;
}

export const useEmoteResourceLoader = ({
  channelId,
  accessToken,
  isChatConnected,
  isMountedRef,
}: UseEmoteResourceLoaderOptions) => {
  const { user } = useAuthContext();
  const loadingAbortRef = useRef<AbortController | null>(null);
  const emoteLoadingStartedRef = useRef(false);

  const loadEmotes = useCallback(() => {
    if (!channelId?.trim() || !accessToken || emoteLoadingStartedRef.current) {
      return;
    }

    if (loadingAbortRef.current) {
      loadingAbortRef.current.abort();
    }

    loadingAbortRef.current = new AbortController();
    const abortController = loadingAbortRef.current;

    let retryCount = 0;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const checkAndLoad = () => {
      if (!isMountedRef.current || abortController.signal.aborted) return;

      const chatConnected = isChatConnected();

      if (chatConnected) {
        emoteLoadingStartedRef.current = true;
        void loadChannelResources({
          channelId,
          twitchUserId: user?.id,
        }).then(success => {
          if (isMountedRef.current && !abortController.signal.aborted) {
            if (!success) {
              emoteLoadingStartedRef.current = false;
            }
          }
        });
      } else if (retryCount < MAX_CONNECTION_RETRIES) {
        retryCount += 1;
        timeoutId = setTimeout(checkAndLoad, RETRY_INTERVAL_MS);
      } else {
        logger.chat.warn(
          'Max retries reached waiting for websocket connection',
        );
        emoteLoadingStartedRef.current = false;
      }
    };

    timeoutId = setTimeout(checkAndLoad, RETRY_INTERVAL_MS);

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      abortController.abort();
      emoteLoadingStartedRef.current = false;
    };
  }, [channelId, accessToken, isMountedRef, isChatConnected, user?.id]);

  const handleRefetch = useCallback(() => {
    emoteLoadingStartedRef.current = false;
    void loadChannelResources({
      channelId,
      forceRefresh: true,
      twitchUserId: user?.id,
    });
  }, [channelId, user?.id]);

  const cleanup = useCallback(() => {
    if (loadingAbortRef.current) {
      loadingAbortRef.current.abort();
      loadingAbortRef.current = null;
    }
    emoteLoadingStartedRef.current = false;
  }, []);

  const getEmoteSetId = useCallback(() => {
    return getSevenTvEmoteSetId(channelId) || undefined;
  }, [channelId]);

  useEffect(() => {
    const cleanupFn = loadEmotes();
    return () => {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-return
      void cleanupFn?.then(fn => fn?.());
    };
  }, [loadEmotes]);

  return {
    loadingAbortRef,
    emoteLoadingStartedRef,
    handleRefetch,
    cleanup,
    getEmoteSetId,
  };
};
