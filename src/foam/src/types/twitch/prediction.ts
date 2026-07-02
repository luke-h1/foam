export type ChannelPredictionStatus =
  'active' | 'locked' | 'resolved' | 'canceled';

export interface TwitchPredictionTopPredictor {
  user_id: string;
  user_login: string;
  user_name: string;
  channel_points_used: number;
  channel_points_won: number | null;
}

type TwitchPredictionColor = 'BLUE' | 'PINK' | (string & {});

export interface TwitchPredictionOutcome {
  id: string;
  title: string;
  color: TwitchPredictionColor;
  users: number;
  channel_points: number;
  top_predictors: TwitchPredictionTopPredictor[] | null;
}

export interface TwitchHelixPrediction {
  id: string;
  broadcaster_id: string;
  broadcaster_login: string;
  broadcaster_name: string;
  title: string;
  winning_outcome_id: string | null;
  outcomes: TwitchPredictionOutcome[];
  prediction_window: number;
  status: 'ACTIVE' | 'LOCKED' | 'RESOLVED' | 'CANCELED';
  created_at: string;
  ended_at: string | null;
  locked_at: string | null;
}

export interface TwitchEventSubPrediction {
  id: string;
  broadcaster_user_id: string;
  broadcaster_user_login: string;
  broadcaster_user_name: string;
  title: string;
  outcomes: TwitchPredictionOutcome[];
  started_at: string;
  locks_at?: string;
  locked_at?: string;
  ended_at?: string;
  status?: 'resolved' | 'canceled' | 'locked';
  winning_outcome_id?: string;
}

export interface ChannelPredictionOutcomeState {
  id: string;
  title: string;
  color: 'blue' | 'pink' | 'neutral';
  users: number;
  channelPoints: number;
  percentage: number;
  isWinner: boolean;
}

export interface ChannelPredictionState {
  id: string;
  broadcasterId: string;
  broadcasterLogin: string;
  broadcasterName: string;
  title: string;
  outcomes: ChannelPredictionOutcomeState[];
  totalUsers: number;
  totalChannelPoints: number;
  predictionWindowSeconds?: number;
  startedAt: string;
  locksAt?: string;
  lockedAt?: string;
  endedAt?: string;
  winningOutcomeId?: string;
  status: ChannelPredictionStatus;
  isActive: boolean;
  isLocked: boolean;
}
