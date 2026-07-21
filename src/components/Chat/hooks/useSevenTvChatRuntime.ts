import { useEffect, useRef, useState } from 'react';
import type { MutableRefObject } from 'react';

import { useSeventvWs } from '@app/hooks/useSeventvWs';
import { ReadyState } from '@app/hooks/ws/constants';
import { sevenTvService } from '@app/services/seventv-service';
import {
  getSevenTvEmoteSetId,
  switchSevenTvEmoteSet,
  updateSevenTvEmotes,
} from '@app/store/chat/actions/channelLoad';
import type { AnyChatMessageType } from '@app/store/chat/types/constants';
import { logger } from '@app/utils/logger';

import { useChatSevenTvCallbacks } from './useChatSevenTvCallbacks';

export function useSevenTvChatRuntime({
  channelId,
  channelName,
  currentEmoteSetIdRef,
  emoteLoadStatus,
  handleNewMessage,
  sevenTvEmoteSetId,
}: {
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
    updateSevenTvEmotes,
    onEmoteNotice: handleNewMessage,
  });

  /**
   * The channel owner's 7TV user id backs the user.update subscription that
   * detects live emote-set switches; the channel id is the owner's Twitch id.
   * Keyed by channel so a stale resolution never leaks across a channel hop.
   */
  const [resolvedOwner, setResolvedOwner] = useState<{
    channelId: string;
    sevenTvUserId?: string;
  } | null>(null);

  useEffect(() => {
    if (!channelId) {
      return;
    }
    let cancelled = false;
    void sevenTvService
      .get7tvUserId(channelId)
      .then(sevenTvUserId => {
        if (!cancelled) {
          setResolvedOwner({
            channelId,
            sevenTvUserId: sevenTvUserId || undefined,
          });
        }
      })
      .catch(() => {
        if (!cancelled) {
          setResolvedOwner({ channelId, sevenTvUserId: undefined });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [channelId]);

  const sevenTvChannelUserId =
    resolvedOwner?.channelId === channelId
      ? resolvedOwner.sevenTvUserId
      : undefined;

  const subscribeToChannelRef = useRef<(emoteSetId: string) => void>(() => {});
  const emoteSetIdRefForSwitch = currentEmoteSetIdRef;

  const onEmoteSetSwitch = ({ newSetId }: { newSetId: string }) => {
    void (async () => {
      const switched = await switchSevenTvEmoteSet(channelId, newSetId);
      if (!switched) {
        return;
      }
      emoteSetIdRefForSwitch.current = newSetId;
      subscribeToChannelRef.current(newSetId);
    })();
  };

  const {
    subscribeToChannel,
    unsubscribeFromChannel,
    isConnected,
    readyState,
  } = useSeventvWs({
    ...sevenTvCallbacks,
    sevenTvChannelUserId,
    onEmoteSetSwitch,
    onEvent: eventType => logger.stvWs.debug(`SevenTV event: ${eventType}`),
  });
  const wsConnected = readyState === ReadyState.OPEN && isConnected();
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
