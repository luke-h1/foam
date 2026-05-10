import type {
  ChannelPredictionOutcomeState,
  ChannelPredictionState,
  ChannelPredictionStatus,
  TwitchEventSubPrediction,
  TwitchHelixPrediction,
  TwitchPredictionOutcome,
} from '@app/types/twitch/prediction';

function normaliseStatus(status: string | undefined): ChannelPredictionStatus {
  switch (status?.toLowerCase()) {
    case 'active':
      return 'active';
    case 'locked':
      return 'locked';
    case 'resolved':
      return 'resolved';
    case 'canceled':
    default:
      return 'canceled';
  }
}

function normaliseOutcomeColor(color: string): 'blue' | 'pink' | 'neutral' {
  switch (color.toLowerCase()) {
    case 'blue':
      return 'blue';
    case 'pink':
      return 'pink';
    default:
      return 'neutral';
  }
}

function toOutcomeState(
  outcomes: TwitchPredictionOutcome[],
  totalChannelPoints: number,
  winningOutcomeId?: string,
): ChannelPredictionOutcomeState[] {
  return outcomes.map(outcome => ({
    id: outcome.id,
    title: outcome.title,
    color: normaliseOutcomeColor(outcome.color),
    users: outcome.users,
    channelPoints: outcome.channel_points,
    percentage:
      totalChannelPoints > 0
        ? Math.round((outcome.channel_points / totalChannelPoints) * 100)
        : 0,
    isWinner: Boolean(winningOutcomeId && winningOutcomeId === outcome.id),
  }));
}

export function normaliseHelixPrediction(
  prediction: TwitchHelixPrediction,
): ChannelPredictionState {
  const totalUsers = prediction.outcomes.reduce(
    (sum, outcome) => sum + outcome.users,
    0,
  );
  const totalChannelPoints = prediction.outcomes.reduce(
    (sum, outcome) => sum + outcome.channel_points,
    0,
  );
  const status = normaliseStatus(prediction.status);

  return {
    id: prediction.id,
    broadcasterId: prediction.broadcaster_id,
    broadcasterLogin: prediction.broadcaster_login,
    broadcasterName: prediction.broadcaster_name,
    title: prediction.title,
    outcomes: toOutcomeState(
      prediction.outcomes,
      totalChannelPoints,
      prediction.winning_outcome_id ?? undefined,
    ),
    totalUsers,
    totalChannelPoints,
    predictionWindowSeconds: prediction.prediction_window,
    startedAt: prediction.created_at,
    locksAt: prediction.locked_at ?? undefined,
    lockedAt: prediction.locked_at ?? undefined,
    endedAt: prediction.ended_at ?? undefined,
    winningOutcomeId: prediction.winning_outcome_id ?? undefined,
    status,
    isActive: status === 'active',
    isLocked: status === 'locked',
  };
}

export function normaliseEventSubPrediction(
  prediction: TwitchEventSubPrediction,
  fallbackStatus: ChannelPredictionStatus = 'active',
): ChannelPredictionState {
  const totalUsers = prediction.outcomes.reduce(
    (sum, outcome) => sum + outcome.users,
    0,
  );
  const totalChannelPoints = prediction.outcomes.reduce(
    (sum, outcome) => sum + outcome.channel_points,
    0,
  );
  const status = prediction.status
    ? normaliseStatus(prediction.status)
    : fallbackStatus;

  return {
    id: prediction.id,
    broadcasterId: prediction.broadcaster_user_id,
    broadcasterLogin: prediction.broadcaster_user_login,
    broadcasterName: prediction.broadcaster_user_name,
    title: prediction.title,
    outcomes: toOutcomeState(
      prediction.outcomes,
      totalChannelPoints,
      prediction.winning_outcome_id,
    ),
    totalUsers,
    totalChannelPoints,
    startedAt: prediction.started_at,
    locksAt: prediction.locks_at,
    lockedAt: prediction.locked_at,
    endedAt: prediction.ended_at,
    winningOutcomeId: prediction.winning_outcome_id,
    status,
    isActive: status === 'active',
    isLocked: status === 'locked',
  };
}
