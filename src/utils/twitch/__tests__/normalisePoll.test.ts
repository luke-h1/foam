import type {
  ChannelPollChoiceState,
  ChannelPollState,
} from '@app/types/twitch/poll';
import {
  createEventSubPoll,
  createHelixPoll,
} from '@app/utils/twitch/channel-activity/__tests__/__fixtures__/channelPollActivity.fixture';

import { normaliseEventSubPoll, normaliseHelixPoll } from '../normalisePoll';

const choices: ChannelPollChoiceState[] = [
  {
    id: 'choice-a',
    title: 'Crisps',
    votes: 3,
    channelPointsVotes: 1,
    bitsVotes: 0,
    percentage: 75,
  },
  {
    id: 'choice-b',
    title: 'Chocolate',
    votes: 1,
    channelPointsVotes: 0,
    bitsVotes: 0,
    percentage: 25,
  },
];

describe('normalisePoll', () => {
  test('normalises a helix poll and derives endsAt from the duration', () => {
    expect(normaliseHelixPoll(createHelixPoll())).toEqual<ChannelPollState>({
      id: 'poll-1',
      broadcasterId: 'channel-id',
      broadcasterLogin: 'streamer',
      broadcasterName: 'Streamer',
      title: 'Best snack?',
      choices,
      totalVotes: 4,
      channelPointsVotingEnabled: true,
      channelPointsPerVote: 200,
      durationSeconds: 120,
      startedAt: '2026-05-09T10:00:00Z',
      endsAt: '2026-05-09T10:02:00.000Z',
      status: 'active',
      isActive: true,
    });
  });

  test('normalises an eventsub poll with the fallback status and its own endsAt', () => {
    expect(
      normaliseEventSubPoll(
        createEventSubPoll({ ended_at: '2026-05-09T10:01:00Z' }),
        'completed',
      ),
    ).toEqual<ChannelPollState>({
      id: 'poll-1',
      broadcasterId: 'channel-id',
      broadcasterLogin: 'streamer',
      broadcasterName: 'Streamer',
      title: 'Best snack?',
      choices,
      totalVotes: 4,
      channelPointsVotingEnabled: true,
      channelPointsPerVote: 200,
      startedAt: '2026-05-09T10:00:00Z',
      endsAt: '2026-05-09T10:02:00Z',
      endedAt: '2026-05-09T10:01:00Z',
      status: 'completed',
      isActive: false,
    });
  });

  test('prefers the payload status over the fallback', () => {
    expect(
      normaliseEventSubPoll(
        createEventSubPoll({ status: 'terminated' }),
        'completed',
      ).status,
    ).toBe('terminated');
  });
});
