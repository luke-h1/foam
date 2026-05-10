export type ChannelPollStatus =
  | 'active'
  | 'completed'
  | 'archived'
  | 'terminated'
  | 'moderated'
  | 'invalid';

export interface TwitchPollChoice {
  id: string;
  title: string;
  votes: number;
  channel_points_votes: number;
  bits_votes: number;
}

export interface TwitchHelixPoll {
  id: string;
  broadcaster_id: string;
  broadcaster_login: string;
  broadcaster_name: string;
  title: string;
  choices: TwitchPollChoice[];
  bits_voting_enabled: boolean;
  bits_per_vote: number;
  channel_points_voting_enabled: boolean;
  channel_points_per_vote: number;
  status:
    | 'ACTIVE'
    | 'COMPLETED'
    | 'TERMINATED'
    | 'ARCHIVED'
    | 'MODERATED'
    | 'INVALID';
  duration: number;
  started_at: string;
  ended_at: string | null;
}

export interface TwitchEventSubPollVotingSettings {
  is_enabled: boolean;
  amount_per_vote: number;
}

export interface TwitchEventSubPoll {
  id: string;
  broadcaster_user_id: string;
  broadcaster_user_login: string;
  broadcaster_user_name: string;
  title: string;
  choices: TwitchPollChoice[];
  channel_points_voting: TwitchEventSubPollVotingSettings;
  started_at: string;
  ends_at?: string;
  ended_at?: string;
  status?: 'completed' | 'archived' | 'terminated';
}

export interface ChannelPollChoiceState {
  id: string;
  title: string;
  votes: number;
  channelPointsVotes: number;
  bitsVotes: number;
  percentage: number;
}

export interface ChannelPollState {
  id: string;
  broadcasterId: string;
  broadcasterLogin: string;
  broadcasterName: string;
  title: string;
  choices: ChannelPollChoiceState[];
  totalVotes: number;
  channelPointsVotingEnabled: boolean;
  channelPointsPerVote: number;
  durationSeconds?: number;
  startedAt: string;
  endsAt?: string;
  endedAt?: string;
  status: ChannelPollStatus;
  isActive: boolean;
}
