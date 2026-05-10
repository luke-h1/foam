import { useAuthContext } from '@app/context/AuthContext';
import TwitchWsService from '@app/services/twitch-ws-service';
import { twitchService } from '@app/services/twitch-service';
import type {
  ChannelPredictionState,
  TwitchEventSubPrediction,
} from '@app/types/twitch/prediction';
import {
  normaliseEventSubPrediction,
  normaliseHelixPrediction,
} from '@app/utils/twitch/normalisePrediction';
import { logger } from '@app/utils/logger';
import { useEffect, useMemo, useState } from 'react';

interface EventSubMessage {
  event?: Record<string, unknown>;
}

export function useChannelPrediction(channelId?: string) {
  const { authState, user } = useAuthContext();
  const [prediction, setPrediction] = useState<ChannelPredictionState | null>(
    null,
  );

  const canSubscribe = Boolean(channelId && authState?.isLoggedIn);
  const isOwnChannel = Boolean(channelId && user?.id === channelId);

  useEffect(() => {
    setPrediction(null);
  }, [channelId]);

  useEffect(() => {
    if (!isOwnChannel || !channelId) {
      return;
    }

    let cancelled = false;

    void twitchService
      .getPredictions({ broadcasterId: channelId, first: 1 })
      .then(response => {
        if (cancelled) {
          return;
        }

        const activePrediction = response.data.find(
          item => item.status === 'ACTIVE' || item.status === 'LOCKED',
        );
        setPrediction(
          activePrediction ? normaliseHelixPrediction(activePrediction) : null,
        );
      })
      .catch(error => {
        logger.twitchWs.warn(
          'Failed to fetch initial helix prediction state',
          error,
        );
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
      const event = message.event as TwitchEventSubPrediction | undefined;
      if (!event) return;
      setPrediction(normaliseEventSubPrediction(event, 'active'));
    };

    const handleProgress = (message: EventSubMessage) => {
      const event = message.event as TwitchEventSubPrediction | undefined;
      if (!event) return;
      setPrediction(normaliseEventSubPrediction(event, 'active'));
    };

    const handleLock = (message: EventSubMessage) => {
      const event = message.event as TwitchEventSubPrediction | undefined;
      if (!event) return;
      setPrediction(normaliseEventSubPrediction(event, 'locked'));
    };

    const handleEnd = (message: EventSubMessage) => {
      const event = message.event as TwitchEventSubPrediction | undefined;
      if (!event) return;
      setPrediction(normaliseEventSubPrediction(event, 'resolved'));
    };

    void TwitchWsService.subscribeToEvent(
      'channel.prediction.begin',
      '1',
      { broadcaster_user_id: channelId },
      handleBegin,
    );
    void TwitchWsService.subscribeToEvent(
      'channel.prediction.progress',
      '1',
      { broadcaster_user_id: channelId },
      handleProgress,
    );
    void TwitchWsService.subscribeToEvent(
      'channel.prediction.lock',
      '1',
      { broadcaster_user_id: channelId },
      handleLock,
    );
    void TwitchWsService.subscribeToEvent(
      'channel.prediction.end',
      '1',
      { broadcaster_user_id: channelId },
      handleEnd,
    );

    return () => {
      void Promise.all([
        TwitchWsService.unsubscribeFromEvent(
          'channel.prediction.begin',
          handleBegin,
        ),
        TwitchWsService.unsubscribeFromEvent(
          'channel.prediction.progress',
          handleProgress,
        ),
        TwitchWsService.unsubscribeFromEvent(
          'channel.prediction.lock',
          handleLock,
        ),
        TwitchWsService.unsubscribeFromEvent(
          'channel.prediction.end',
          handleEnd,
        ),
      ]).finally(() => {
        TwitchWsService.disconnect();
      });
    };
  }, [canSubscribe, channelId]);

  return useMemo(
    () => ({
      prediction,
      canVoteInApp: false,
      isAvailable: canSubscribe,
    }),
    [canSubscribe, prediction],
  );
}
