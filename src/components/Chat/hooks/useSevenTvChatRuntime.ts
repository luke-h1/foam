import { useSeventvWs } from '@app/hooks/useSeventvWs';
import { ReadyState } from '@app/hooks/ws/constants';
import {
  getSevenTvEmoteSetId,
  updateSevenTvEmotes,
} from '@app/store/chat/actions/channelLoad';
import { fetchAndCacheUserCosmetics } from '@app/store/chat/actions/cosmetics';
import { logger } from '@app/utils/logger';
import { useEffect, useRef } from 'react';
import type { RefObject } from 'react';

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
  currentEmoteSetIdRef: RefObject<string | null>;
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
  const subscribeToChannelRef = useRef(subscribeToChannel);
  const unsubscribeFromChannelRef = useRef(unsubscribeFromChannel);
  subscribeToChannelRef.current = subscribeToChannel;
  unsubscribeFromChannelRef.current = unsubscribeFromChannel;

  useEffect(() => {
    if (!wsConnected || !channelId || emoteLoadStatus !== 'success') {
      return;
    }

    const emoteSetIdRef = currentEmoteSetIdRef;
    const emoteSetId = getSevenTvEmoteSetId(channelId);
    if (!emoteSetId) {
      logger.stvWs.info(
        `No SevenTV emote set ID found for channel: ${channelId}`,
      );
      return;
    }

    if (emoteSetIdRef.current && emoteSetIdRef.current !== emoteSetId) {
      unsubscribeFromChannelRef.current();
    }

    if (emoteSetIdRef.current !== emoteSetId) {
      emoteSetIdRef.current = emoteSetId;
      subscribeToChannelRef.current(emoteSetId);
    }

    return () => {
      unsubscribeFromChannelRef.current();
      emoteSetIdRef.current = null;
    };
  }, [channelId, currentEmoteSetIdRef, emoteLoadStatus, wsConnected]);
}
