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
import { useEffect, useLayoutEffect, useRef, useState } from 'react';

interface EventSubMessage {
  event?: Record<string, unknown>;
}

export function useChannelPrediction(channelId?: string) {
  const { authState, user } = useAuthContext();
  const [prediction, setPrediction] = useState<ChannelPredictionState | null>(
    null,
  );

  const isOwnChannel = Boolean(channelId && user?.id === channelId);
  const canSubscribe = Boolean(
    channelId && authState?.isLoggedIn && isOwnChannel,
  );
  const channelScopeKey = `${channelId ?? ''}:${isOwnChannel}`;
  const lastChannelScopeKeyRef = useRef(channelScopeKey);

  useLayoutEffect(() => {
    if (lastChannelScopeKeyRef.current !== channelScopeKey) {
      lastChannelScopeKeyRef.current = channelScopeKey;
      setPrediction(null);
    }
  }, [channelScopeKey]);

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
          'Failed to fetch initial Twitch prediction state',
          {
            name: 'twitch_predictions_warning',
            error,
            action: 'initial_prediction_fetch_failed',
            channel_id: channelId,
            provider: 'twitch',
            screen: 'chat',
          },
        );
      });

    return () => {
      cancelled = true;
    };
  }, [channelId, channelScopeKey, isOwnChannel]);

  // eslint-disable-next-line react-doctor/no-cascading-set-state -- EventSub handlers update on independent Twitch events
  useEffect(() => {
    if (!canSubscribe || !channelId) {
      return;
    }

    const onBegin = (message: EventSubMessage) => {
      const event = message.event as TwitchEventSubPrediction | undefined;
      if (!event) {
        return;
      }
      setPrediction(normaliseEventSubPrediction(event, 'active'));
    };

    const onProgress = (message: EventSubMessage) => {
      const event = message.event as TwitchEventSubPrediction | undefined;
      if (!event) {
        return;
      }
      setPrediction(normaliseEventSubPrediction(event, 'active'));
    };

    const onLock = (message: EventSubMessage) => {
      const event = message.event as TwitchEventSubPrediction | undefined;
      if (!event) {
        return;
      }
      setPrediction(normaliseEventSubPrediction(event, 'locked'));
    };

    const onEnd = (message: EventSubMessage) => {
      const event = message.event as TwitchEventSubPrediction | undefined;
      if (!event) {
        return;
      }
      setPrediction(normaliseEventSubPrediction(event, 'resolved'));
    };

    TwitchWsService.getInstance();

    void TwitchWsService.subscribeToEvent(
      'channel.prediction.begin',
      '1',
      { broadcaster_user_id: channelId },
      onBegin,
    );
    void TwitchWsService.subscribeToEvent(
      'channel.prediction.progress',
      '1',
      { broadcaster_user_id: channelId },
      onProgress,
    );
    void TwitchWsService.subscribeToEvent(
      'channel.prediction.lock',
      '1',
      { broadcaster_user_id: channelId },
      onLock,
    );
    void TwitchWsService.subscribeToEvent(
      'channel.prediction.end',
      '1',
      { broadcaster_user_id: channelId },
      onEnd,
    );

    return () => {
      void Promise.all([
        TwitchWsService.unsubscribeFromEvent(
          'channel.prediction.begin',
          onBegin,
        ),
        TwitchWsService.unsubscribeFromEvent(
          'channel.prediction.progress',
          onProgress,
        ),
        TwitchWsService.unsubscribeFromEvent('channel.prediction.lock', onLock),
        TwitchWsService.unsubscribeFromEvent('channel.prediction.end', onEnd),
      ]).finally(() => {
        TwitchWsService.disconnect();
      });
    };
  }, [canSubscribe, channelId]);

  return {
    prediction,
    canVoteInApp: false,
    isAvailable: canSubscribe,
  };
}
