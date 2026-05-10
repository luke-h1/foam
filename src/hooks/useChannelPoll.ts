import { useAuthContext } from '@app/context/AuthContext';
import TwitchWsService from '@app/services/twitch-ws-service';
import { twitchService } from '@app/services/twitch-service';
import type {
  ChannelPollState,
  TwitchEventSubPoll,
} from '@app/types/twitch/poll';
import {
  normaliseEventSubPoll,
  normaliseHelixPoll,
} from '@app/utils/twitch/normalisePoll';
import { logger } from '@app/utils/logger';
import { useEffect, useMemo, useState } from 'react';

interface EventSubMessage {
  event?: Record<string, unknown>;
}

export function useChannelPoll(channelId?: string) {
  const { authState, user } = useAuthContext();
  const [poll, setPoll] = useState<ChannelPollState | null>(null);

  const canSubscribe = Boolean(channelId && authState?.isLoggedIn);
  const isOwnChannel = Boolean(channelId && user?.id === channelId);

  useEffect(() => {
    setPoll(null);
  }, [channelId]);

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
        logger.twitchWs.warn('Failed to fetch initial helix poll state', error);
      });

    return () => {
      cancelled = true;
    };
  }, [channelId, isOwnChannel]);

  useEffect(() => {
    if (!canSubscribe || !channelId) {
      return;
    }

    TwitchWsService.getInstance();

    const handleBegin = (message: EventSubMessage) => {
      const event = message.event as TwitchEventSubPoll | undefined;
      if (!event) return;
      setPoll(normaliseEventSubPoll(event, 'active'));
    };

    const handleProgress = (message: EventSubMessage) => {
      const event = message.event as TwitchEventSubPoll | undefined;
      if (!event) return;
      setPoll(normaliseEventSubPoll(event, 'active'));
    };

    const handleEnd = (message: EventSubMessage) => {
      const event = message.event as TwitchEventSubPoll | undefined;
      if (!event) return;
      setPoll(normaliseEventSubPoll(event, 'completed'));
    };

    void TwitchWsService.subscribeToEvent(
      'channel.poll.begin',
      '1',
      { broadcaster_user_id: channelId },
      handleBegin,
    );
    void TwitchWsService.subscribeToEvent(
      'channel.poll.progress',
      '1',
      { broadcaster_user_id: channelId },
      handleProgress,
    );
    void TwitchWsService.subscribeToEvent(
      'channel.poll.end',
      '1',
      { broadcaster_user_id: channelId },
      handleEnd,
    );

    return () => {
      void Promise.all([
        TwitchWsService.unsubscribeFromEvent('channel.poll.begin', handleBegin),
        TwitchWsService.unsubscribeFromEvent(
          'channel.poll.progress',
          handleProgress,
        ),
        TwitchWsService.unsubscribeFromEvent('channel.poll.end', handleEnd),
      ]).finally(() => {
        TwitchWsService.disconnect();
      });
    };
  }, [canSubscribe, channelId]);

  return useMemo(
    () => ({
      poll,
      canVoteInApp: false,
      isAvailable: canSubscribe,
    }),
    [canSubscribe, poll],
  );
}
