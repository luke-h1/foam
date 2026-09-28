import type {
  TwitchEventSubPoll,
  TwitchHelixPoll,
} from '@app/types/twitch/poll';

export function createHelixPoll(
  overrides: Partial<TwitchHelixPoll> = {},
): TwitchHelixPoll {
  return {
    id: 'poll-1',
    broadcaster_id: 'channel-id',
    broadcaster_login: 'streamer',
    broadcaster_name: 'Streamer',
    title: 'Best snack?',
    choices: [
      {
        id: 'choice-a',
        title: 'Crisps',
        votes: 3,
        channel_points_votes: 1,
        bits_votes: 0,
      },
      {
        id: 'choice-b',
        title: 'Chocolate',
        votes: 1,
        channel_points_votes: 0,
        bits_votes: 0,
      },
    ],
    bits_voting_enabled: false,
    bits_per_vote: 0,
    channel_points_voting_enabled: true,
    channel_points_per_vote: 200,
    status: 'ACTIVE',
    duration: 120,
    started_at: '2026-05-09T10:00:00Z',
    ended_at: null,
    ...overrides,
  };
}

export function createEventSubPoll(
  overrides: Partial<TwitchEventSubPoll> = {},
): TwitchEventSubPoll {
  return {
    id: 'poll-1',
    broadcaster_user_id: 'channel-id',
    broadcaster_user_login: 'streamer',
    broadcaster_user_name: 'Streamer',
    title: 'Best snack?',
    choices: [
      {
        id: 'choice-a',
        title: 'Crisps',
        votes: 3,
        channel_points_votes: 1,
        bits_votes: 0,
      },
      {
        id: 'choice-b',
        title: 'Chocolate',
        votes: 1,
        channel_points_votes: 0,
        bits_votes: 0,
      },
    ],
    channel_points_voting: {
      is_enabled: true,
      amount_per_vote: 200,
    },
    started_at: '2026-05-09T10:00:00Z',
    ends_at: '2026-05-09T10:02:00Z',
    ...overrides,
  };
}
