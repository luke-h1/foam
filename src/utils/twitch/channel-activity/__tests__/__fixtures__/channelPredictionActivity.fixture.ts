import type {
  TwitchEventSubPrediction,
  TwitchHelixPrediction,
} from '@app/types/twitch/prediction';

export function createHelixPrediction(
  overrides: Partial<TwitchHelixPrediction> = {},
): TwitchHelixPrediction {
  return {
    id: 'prediction-1',
    broadcaster_id: 'channel-id',
    broadcaster_login: 'streamer',
    broadcaster_name: 'Streamer',
    title: 'Will we win?',
    winning_outcome_id: null,
    outcomes: [
      {
        id: 'outcome-a',
        title: 'Yes',
        color: 'BLUE',
        users: 3,
        channel_points: 300,
        top_predictors: null,
      },
      {
        id: 'outcome-b',
        title: 'No',
        color: 'PINK',
        users: 1,
        channel_points: 100,
        top_predictors: null,
      },
    ],
    prediction_window: 300,
    status: 'ACTIVE',
    created_at: '2026-05-09T10:00:00Z',
    ended_at: null,
    locked_at: null,
    ...overrides,
  };
}

export function createEventSubPrediction(
  overrides: Partial<TwitchEventSubPrediction> = {},
): TwitchEventSubPrediction {
  return {
    id: 'prediction-1',
    broadcaster_user_id: 'channel-id',
    broadcaster_user_login: 'streamer',
    broadcaster_user_name: 'Streamer',
    title: 'Will we win?',
    outcomes: [
      {
        id: 'outcome-a',
        title: 'Yes',
        color: 'BLUE',
        users: 3,
        channel_points: 300,
        top_predictors: null,
      },
      {
        id: 'outcome-b',
        title: 'No',
        color: 'PINK',
        users: 1,
        channel_points: 100,
        top_predictors: null,
      },
    ],
    started_at: '2026-05-09T10:00:00Z',
    locks_at: '2026-05-09T10:05:00Z',
    ...overrides,
  };
}
