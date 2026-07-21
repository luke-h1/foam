import { useEffect, useLayoutEffect, useRef, useState } from 'react';

import { useAuthContext } from '@app/context/AuthContext';
import { twitchService } from '@app/services/twitch-service';
import TwitchWsService from '@app/services/twitch-ws-service';
import type {
  ChannelPollState,
  TwitchEventSubPoll,
} from '@app/types/twitch/poll';
import { logger } from '@app/utils/logger';
import {
  normaliseEventSubPoll,
  normaliseHelixPoll,
} from '@app/utils/twitch/normalisePoll';

interface EventSubMessage {
  event?: Record<string, unknown>;
}

export function useChannelPoll(channelId?: string) {
  const { authState, user } = useAuthContext();
  const [poll, setPoll] = useState<ChannelPollState | null>(null);

  const isOwnChannel = Boolean(channelId && user?.id === channelId);
  const canSubscribe = Boolean(
    channelId && authState?.isLoggedIn && isOwnChannel,
  );
  const channelScopeKey = `${channelId ?? ''}:${isOwnChannel}`;
  const lastChannelScopeKeyRef = useRef(channelScopeKey);

  useLayoutEffect(() => {
    if (lastChannelScopeKeyRef.current !== channelScopeKey) {
      lastChannelScopeKeyRef.current = channelScopeKey;
      setPoll(null);
    }
  }, [channelScopeKey]);

  useEffect(() => {
    if (!isOwnChannel || !channelId) {
      return;
    }

    let cancelled = false;

    void twitchService
      .getPolls({ broadcasterId: channelId, first: 1 })
      .then(response => {
        if (cancelled) {
          return;
        }

        const activePoll = response.data.find(item => item.status === 'ACTIVE');
        setPoll(activePoll ? normaliseHelixPoll(activePoll) : null);
      })
      .catch(error => {
        logger.twitchWs.warn('Failed to fetch initial Twitch poll state', {
          name: 'twitch_polls_warning',
          error,
          action: 'initial_poll_fetch_failed',
          channel_id: channelId,
          provider: 'twitch',
          screen: 'chat',
        });
      });

    return () => {
      cancelled = true;
    };
  }, [channelId, channelScopeKey, isOwnChannel]);

  // EventSub handlers update on independent Twitch events
  // eslint-disable-next-line react-doctor/no-cascading-set-state
  useEffect(() => {
    if (!canSubscribe || !channelId) {
      return;
    }

    const onBegin = (message: EventSubMessage) => {
      const event = message.event as TwitchEventSubPoll | undefined;
      if (!event) {
        return;
      }
      setPoll(normaliseEventSubPoll(event, 'active'));
    };

    const onProgress = (message: EventSubMessage) => {
      const event = message.event as TwitchEventSubPoll | undefined;
      if (!event) {
        return;
      }
      setPoll(normaliseEventSubPoll(event, 'active'));
    };

    const onEnd = (message: EventSubMessage) => {
      const event = message.event as TwitchEventSubPoll | undefined;
      if (!event) {
        return;
      }
      setPoll(normaliseEventSubPoll(event, 'completed'));
    };

    TwitchWsService.getInstance();

    void TwitchWsService.subscribeToEvent(
      'channel.poll.begin',
      '1',
      { broadcaster_user_id: channelId },
      onBegin,
    );
    void TwitchWsService.subscribeToEvent(
      'channel.poll.progress',
      '1',
      { broadcaster_user_id: channelId },
      onProgress,
    );
    void TwitchWsService.subscribeToEvent(
      'channel.poll.end',
      '1',
      { broadcaster_user_id: channelId },
      onEnd,
    );

    return () => {
      void Promise.all([
        TwitchWsService.unsubscribeFromEvent('channel.poll.begin', onBegin),
        TwitchWsService.unsubscribeFromEvent(
          'channel.poll.progress',
          onProgress,
        ),
        TwitchWsService.unsubscribeFromEvent('channel.poll.end', onEnd),
      ]).finally(() => {
        TwitchWsService.disconnect();
      });
    };
  }, [canSubscribe, channelId]);

  return {
    poll,
    canVoteInApp: false,
    isAvailable: canSubscribe,
  };
}
