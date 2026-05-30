import { useSeventvWs } from '@app/hooks/useSeventvWs';
import { ReadyState } from '@app/hooks/ws/constants';
import {
  getSevenTvEmoteSetId,
  updateSevenTvEmotes,
} from '@app/store/chatStore/channelLoad';
import { fetchAndCacheUserCosmetics } from '@app/store/chatStore/cosmetics';
import { logger } from '@app/utils/logger';
import { useEffect, type MutableRefObject } from 'react';

import { useChatSevenTvCallbacks } from './useChatSevenTvCallbacks';
import type { AnyChatMessageType } from '../util/messageHandlers';

export function useSevenTvChatRuntime({
  canFetchCosmetics,
  channelId,
  channelName,
  currentEmoteSetIdRef,
  emoteLoadStatus,
  handleNewMessage,
  sevenTvEmoteSetId,
}: {
  canFetchCosmetics: () => boolean;
  channelId: string;
  channelName: string;
  currentEmoteSetIdRef: MutableRefObject<string | null>;
  emoteLoadStatus: string;
  handleNewMessage: (
    message: AnyChatMessageType,
    options?: { countUnread?: boolean },
  ) => void;
  sevenTvEmoteSetId?: string;
}) {
  const sevenTvCallbacks = useChatSevenTvCallbacks({
    channelId,
    channelName,
    sevenTvEmoteSetId,
    canFetchCosmetics,
    fetchAndCacheUserCosmetics,
    updateSevenTvEmotes,
    onEmoteNotice: handleNewMessage,
  });

  const {
    subscribeToChannel,
    unsubscribeFromChannel,
    isConnected,
    readyState,
  } = useSeventvWs({
    ...sevenTvCallbacks,
    onEvent: eventType => logger.stvWs.debug(`SevenTV event: ${eventType}`),
  });
  const wsConnected = readyState === ReadyState.OPEN && isConnected();

  useEffect(() => {
    if (!wsConnected || !channelId) {
      return;
    }

    const emoteSetId = getSevenTvEmoteSetId(channelId);
    if (!emoteSetId) {
      logger.stvWs.info(
        `No SevenTV emote set ID found for channel: ${channelId}`,
      );
      return;
    }

    if (
      currentEmoteSetIdRef.current &&
      currentEmoteSetIdRef.current !== emoteSetId
    ) {
      unsubscribeFromChannel();
    }

    if (currentEmoteSetIdRef.current !== emoteSetId) {
      currentEmoteSetIdRef.current = emoteSetId;
      subscribeToChannel(emoteSetId);
    }

    return () => {
      unsubscribeFromChannel();
      currentEmoteSetIdRef.current = null;
    };
  }, [
    channelId,
    subscribeToChannel,
    unsubscribeFromChannel,
    wsConnected,
    currentEmoteSetIdRef,
  ]);

  useEffect(() => {
    if (!wsConnected || !channelId || emoteLoadStatus !== 'success') {
      return;
    }

    const emoteSetId = getSevenTvEmoteSetId(channelId);
    if (emoteSetId && currentEmoteSetIdRef.current !== emoteSetId) {
      currentEmoteSetIdRef.current = emoteSetId;
      subscribeToChannel(emoteSetId);
    }
  }, [
    wsConnected,
    channelId,
    emoteLoadStatus,
    subscribeToChannel,
    currentEmoteSetIdRef,
  ]);
}
