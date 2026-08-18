import { twitchService } from '@app/services/twitch-service';
import type {
  ChannelPredictionState,
  TwitchEventSubPrediction,
  TwitchHelixPrediction,
} from '@app/types/twitch/prediction';
import type { ChannelActivity } from '@app/utils/twitch/channelActivity/channelActivity';
import {
  normaliseEventSubPrediction,
  normaliseHelixPrediction,
} from '@app/utils/twitch/normalisePrediction';

export const channelPredictionActivity = {
  fetch: (broadcasterId: string) =>
    twitchService.getPredictions({ broadcasterId, first: 1 }),
  normaliseHelix: normaliseHelixPrediction,
  isActive: (prediction: ChannelPredictionState) =>
    prediction.isActive || prediction.isLocked,
  fetchFailure: {
    message: 'Failed to fetch initial Twitch prediction state',
    name: 'twitch_predictions_warning',
    action: 'initial_prediction_fetch_failed',
  },
  events: [
    {
      type: 'channel.prediction.begin',
      normalise: event =>
        normaliseEventSubPrediction(
          // SAFETY: EventSub delivers this callback only the channel.prediction.begin payload.
          event as TwitchEventSubPrediction,
          'active',
        ),
    },
    {
      type: 'channel.prediction.progress',
      normalise: event =>
        normaliseEventSubPrediction(
          // SAFETY: EventSub delivers this callback only the channel.prediction.progress payload.
          event as TwitchEventSubPrediction,
          'active',
        ),
    },
    {
      type: 'channel.prediction.lock',
      normalise: event =>
        normaliseEventSubPrediction(
          // SAFETY: EventSub delivers this callback only the channel.prediction.lock payload.
          event as TwitchEventSubPrediction,
          'locked',
        ),
    },
    {
      type: 'channel.prediction.end',
      normalise: event =>
        normaliseEventSubPrediction(
          // SAFETY: EventSub delivers this callback only the channel.prediction.end payload.
          event as TwitchEventSubPrediction,
          'resolved',
        ),
    },
  ],
} satisfies ChannelActivity<TwitchHelixPrediction, ChannelPredictionState>;
