import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { InteractionManager } from 'react-native';

import { useSelector } from '@legendapp/state/react';

import { useAuthContext } from '@app/context/AuthContext';
import {
  abortCurrentLoad,
  getCurrentEmoteData,
  getSevenTvEmoteSetId,
  loadChannelResources,
  startChannelLoadAbort,
} from '@app/store/chat/actions/channelLoad';
import { chatStore$ } from '@app/store/chat/observables/chatStore';
import {
  preloadChannelEmotes,
  preloadGlobalEmotes,
} from '@app/utils/image/preloadEmotes';
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

        if (signal.aborted) {
          logger.chat.info('🚫 Emote load was aborted');
          if (isMountedRef.current) {
            setStatus('cancelled');
          }
          return;
        }

        if (!isMountedRef.current) {
          return;
        }

        if (success) {
          setStatus('success');
          currentChannelRef.current = channelId;
          logger.chat.info('✅ Emote load completed', { channelId });

          const emoteData = getCurrentEmoteData(channelId);
          if (emoteData) {
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
          }
        } else {
          setStatus('error');
          logger.chat.warn('❌ Emote load failed', { channelId });
        }
      } catch (error) {
        if (signal.aborted) {
          if (isMountedRef.current) {
            setStatus('cancelled');
          }
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
    [channelId, user?.id],
  );

  const refetch = useCallback(async () => {
    await loadEmotes(true);
  }, [loadEmotes]);

  const loadEmotesRef = useRef(loadEmotes);
  loadEmotesRef.current = loadEmotes;

  const cosmeticsCacheVersion = useSelector(() =>
    chatStore$.cosmeticsCacheVersion.get(),
  );
  const lastCosmeticsCacheVersionRef = useRef(cosmeticsCacheVersion);

  useEffect(() => {
    isMountedRef.current = true;

    const cacheCleared =
      lastCosmeticsCacheVersionRef.current !== cosmeticsCacheVersion;
    lastCosmeticsCacheVersionRef.current = cosmeticsCacheVersion;

    if (enabled && channelId) {
      if (cacheCleared) {
        currentChannelRef.current = null;
        void loadEmotesRef.current(true);
      } else if (currentChannelRef.current !== channelId) {
        void loadEmotesRef.current(false);
      }
    }

    return () => {
      isMountedRef.current = false;
      abortCurrentLoad();
    };
  }, [channelId, enabled, cosmeticsCacheVersion]);

  const sevenTvEmoteSetId = getSevenTvEmoteSetId(channelId) ?? undefined;

  return {
    status,
    sevenTvEmoteSetId,
    refetch,
    cancel,
  };
};
