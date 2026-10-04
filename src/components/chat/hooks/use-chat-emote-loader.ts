import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { InteractionManager } from 'react-native';

import { useSelector } from '@legendapp/state/react';

import { useAuthContext } from '@app/context/auth-context';
import { useSyncRef } from '@app/hooks/use-sync-ref';
import { ensureChannelCacheHydrated } from '@app/store/chat/actions/channel-cache-hydration';
import {
  abortCurrentLoad,
  getCurrentEmoteData,
  loadChannelResources,
  startChannelLoadAbort,
} from '@app/store/chat/actions/channel-load';
import { getSevenTvEmoteSetId } from '@app/store/chat/actions/seven-tv-channel-lifecycle';
import { chatStore$ } from '@app/store/chat/observables/chat-store';
import {
  preloadChannelEmotes,
  preloadGlobalEmotes,
} from '@app/utils/image/preload-emotes';
import { logger } from '@app/utils/logger';

export type EmoteLoadingStatus =
  | 'idle'
  | 'loading'
  | 'success'
  | 'error'
  | 'cancelled';

interface UseChatEmoteLoaderOptions {
  channelId: string;
  enabled?: boolean;
}

interface UseChatEmoteLoaderResult {
  status: EmoteLoadingStatus;
  sevenTvEmoteSetId: string | undefined;
  refetch: () => Promise<void>;
  cancel: () => void;
}

export const useChatEmoteLoader = ({
  channelId,
  enabled = true,
}: UseChatEmoteLoaderOptions): UseChatEmoteLoaderResult => {
  const { user } = useAuthContext();
  const [status, setStatus] = useState<EmoteLoadingStatus>('idle');
  const isMountedRef = useRef(true);
  const currentChannelRef = useRef<string | null>(null);
  const lastChannelIdRef = useRef(channelId);

  useLayoutEffect(() => {
    if (lastChannelIdRef.current !== channelId) {
      lastChannelIdRef.current = channelId;
      setStatus('idle');
    }
  }, [channelId]);

  const cancel = useCallback(() => {
    abortCurrentLoad();

    if (isMountedRef.current) {
      setStatus('cancelled');
    }

    logger.chat.info('🚫 Emote load cancelled via hook');
  }, []);

  const loadEmotes = useCallback(
    async (forceRefresh = false) => {
      if (!channelId || !isMountedRef.current) {
        return;
      }

      const { signal } = startChannelLoadAbort();

      logger.chat.info('📦 Starting emote load', {
        channelId,
        forceRefresh,
      });

      setStatus('loading');

      try {
        const success = await loadChannelResources({
          channelId,
          forceRefresh,
          signal,
          twitchUserId: user?.id,
        });

        if (signal.aborted && isMountedRef.current) {
          logger.chat.info('🚫 Emote load was aborted');
          setStatus('cancelled');
          return;
        }

        if (signal.aborted) {
          logger.chat.info('🚫 Emote load was aborted');
          return;
        }

        if (!isMountedRef.current) {
          return;
        }

        if (!success) {
          setStatus('error');
          logger.chat.warn('❌ Emote load failed', { channelId });
          return;
        }

        setStatus('success');
        currentChannelRef.current = channelId;
        logger.chat.info('✅ Emote load completed', { channelId });

        const emoteData = getCurrentEmoteData(channelId);

        if (!emoteData) {
          return;
        }

        InteractionManager.runAfterInteractions(() => {
          if (
            !isMountedRef.current ||
            currentChannelRef.current !== channelId
          ) {
            return;
          }

          void Promise.all([
            preloadGlobalEmotes(emoteData),
            preloadChannelEmotes(emoteData),
          ]).then(() => {
            logger.chat.debug('🖼️ Emote preload completed');
          });
        });
      } catch (error) {
        if (signal.aborted && isMountedRef.current) {
          setStatus('cancelled');
          return;
        }

        if (signal.aborted) {
          return;
        }

        if (isMountedRef.current) {
          setStatus('error');
          logger.chat.error('❌ Emote load error', {
            channelId,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }
    },
    [channelId, user],
  );

  const refetch = useCallback(async () => {
    await loadEmotes(true);
  }, [loadEmotes]);

  const loadEmotesRef = useSyncRef(loadEmotes);

  const cosmeticsCacheVersion = useSelector(() =>
    chatStore$.cosmeticsCacheVersion.get(),
  );

  const lastCosmeticsCacheVersionRef = useRef(cosmeticsCacheVersion);

  useEffect(() => {
    isMountedRef.current = true;

    const cacheCleared =
      lastCosmeticsCacheVersionRef.current !== cosmeticsCacheVersion;

    lastCosmeticsCacheVersionRef.current = cosmeticsCacheVersion;

    const isActive = Boolean(enabled && channelId);

    if (isActive && channelId) {
      ensureChannelCacheHydrated(channelId);
    }

    const hasChannelCache =
      isActive &&
      channelId &&
      Boolean(chatStore$.persisted.channelCaches[channelId]?.peek());

    // A cleared cosmetics cache, or a channel whose cache vanished under it,
    // both need the full reload rather than the cached path.
    const shouldForceRefresh =
      isActive &&
      (cacheCleared ||
        (currentChannelRef.current === channelId && !hasChannelCache));

    const isNewChannel =
      shouldForceRefresh || currentChannelRef.current !== channelId;

    currentChannelRef.current = shouldForceRefresh
      ? null
      : currentChannelRef.current;

    if (isActive && isNewChannel) {
      void loadEmotesRef.current(shouldForceRefresh);
    }

    return () => {
      isMountedRef.current = false;
      abortCurrentLoad();
    };
  }, [channelId, enabled, cosmeticsCacheVersion, loadEmotesRef]);

  const sevenTvEmoteSetId = getSevenTvEmoteSetId(channelId) ?? undefined;

  return {
    status,
    sevenTvEmoteSetId,
    refetch,
    cancel,
  };
};
