import type {
  ChannelPollChoiceState,
  ChannelPollState,
  ChannelPollStatus,
  TwitchEventSubPoll,
  TwitchHelixPoll,
  TwitchPollChoice,
} from '@app/types/twitch/poll';
import { percentageOf } from '@app/utils/number/percentageOf';

function normaliseStatus(status: string | undefined): ChannelPollStatus {
  switch (status?.toLowerCase()) {
    case 'active':
      return 'active';
    case 'completed':
      return 'completed';
    case 'archived':
      return 'archived';
    case 'terminated':
      return 'terminated';
    case 'moderated':
      return 'moderated';
    default:
      return 'invalid';
  }
}

function toChoiceState(
  choices: TwitchPollChoice[],
  totalVotes: number,
): ChannelPollChoiceState[] {
  return choices.map(choice => ({
    id: choice.id,
    title: choice.title,
    votes: choice.votes,
    channelPointsVotes: choice.channel_points_votes,
    bitsVotes: choice.bits_votes,
    percentage: percentageOf(choice.votes, totalVotes),
  }));
}

export function normaliseHelixPoll(poll: TwitchHelixPoll): ChannelPollState {
  const totalVotes = poll.choices.reduce(
    (sum, choice) => sum + choice.votes,
    0,
  );
  const status = normaliseStatus(poll.status);

  return {
    id: poll.id,
    broadcasterId: poll.broadcaster_id,
    broadcasterLogin: poll.broadcaster_login,
    broadcasterName: poll.broadcaster_name,
    title: poll.title,
    choices: toChoiceState(poll.choices, totalVotes),
    totalVotes,
    channelPointsVotingEnabled: poll.channel_points_voting_enabled,
    channelPointsPerVote: poll.channel_points_per_vote,
    durationSeconds: poll.duration,
    startedAt: poll.started_at,
    endsAt: poll.ended_at ?? undefined,
    endedAt: poll.ended_at ?? undefined,
    status,
    isActive: status === 'active',
  };
}

export function normaliseEventSubPoll(
  poll: TwitchEventSubPoll,
  fallbackStatus: ChannelPollStatus = 'active',
): ChannelPollState {
  const totalVotes = poll.choices.reduce(
    (sum, choice) => sum + choice.votes,
    0,
  );
  const status = poll.status ? normaliseStatus(poll.status) : fallbackStatus;

  return {
    id: poll.id,
    broadcasterId: poll.broadcaster_user_id,
    broadcasterLogin: poll.broadcaster_user_login,
    broadcasterName: poll.broadcaster_user_name,
    title: poll.title,
    choices: toChoiceState(poll.choices, totalVotes),
    totalVotes,
    channelPointsVotingEnabled: poll.channel_points_voting.is_enabled,
    channelPointsPerVote: poll.channel_points_voting.amount_per_vote,
    startedAt: poll.started_at,
    endsAt: poll.ends_at,
    endedAt: poll.ended_at,
    status,
    isActive: status === 'active',
  };
}
