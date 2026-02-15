import { useAuthContext } from '@app/context/AuthContext';
import {
  loadChannelResources,
  createLoadController,
  abortCurrentLoad,
  getSevenTvEmoteSetId,
  getCurrentEmoteData,
} from '@app/store/chatStore';
import {
  preloadChannelEmotes,
  preloadGlobalEmotes,
} from '@app/utils/image/preloadEmotes';
import { logger } from '@app/utils/logger';
import { useCallback, useEffect, useRef, useState } from 'react';

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

/**
 * Hook for loading chat emotes with AbortController-based cancellation.
 * Uses the chatStore's abort mechanism to cancel network requests immediately.
 *
 * - Cancels previous loads when starting a new one
 * - Cancels immediately on unmount (doesn't block navigation)
 * - Uses AbortController to cancel in-flight network requests
 */
export const useChatEmoteLoader = ({
  channelId,
  enabled = true,
}: UseChatEmoteLoaderOptions): UseChatEmoteLoaderResult => {
  const { user } = useAuthContext();
  const [status, setStatus] = useState<EmoteLoadingStatus>('idle');
  const isMountedRef = useRef(true);
  const currentChannelRef = useRef<string | null>(null);
  const controllerRef = useRef<AbortController | null>(null);

  const cancel = useCallback(() => {
    // Abort via the local reference for this hook instance
    if (controllerRef.current) {
      controllerRef.current.abort();
      controllerRef.current = null;
    }
    // Also abort via the global store mechanism

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

      // Cancel any previous load and create new controller

      const controller: AbortController = createLoadController();
      controllerRef.current = controller;

      logger.chat.info('📦 Starting emote load', {
        channelId,
        forceRefresh,
      });

      setStatus('loading');

      try {
        const success = await loadChannelResources({
          channelId,
          forceRefresh,
          signal: controller.signal,
          twitchUserId: user?.id,
        });

        // Don't update state if aborted or unmounted
        if (controller.signal.aborted) {
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

          // Preload emotes in background for instant display in chat
          const emoteData = getCurrentEmoteData(channelId);
          if (emoteData) {
            // Preload in background - don't await
            void Promise.all([
              preloadGlobalEmotes(emoteData),
              preloadChannelEmotes(emoteData),
            ]).then(() => {
              logger.chat.debug('🖼️ Emote preload completed');
            });
          }
        } else {
          setStatus('error');
          logger.chat.warn('❌ Emote load failed', { channelId });
        }
      } catch (error) {
        if (controller.signal.aborted) {
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

  useEffect(() => {
    isMountedRef.current = true;

    if (enabled && channelId && currentChannelRef.current !== channelId) {
      void loadEmotes(false);
    }

    return () => {
      isMountedRef.current = false;
      // Cancel on unmount
      cancel();
    };
  }, [channelId, enabled, loadEmotes, cancel]);

  // Reset on channel change
  useEffect(() => {
    if (channelId !== currentChannelRef.current) {
      setStatus('idle');
    }
  }, [channelId]);

  const sevenTvEmoteSetId = getSevenTvEmoteSetId(channelId) ?? undefined;

  return {
    status,
    sevenTvEmoteSetId,
    refetch,
    cancel,
  };
};
