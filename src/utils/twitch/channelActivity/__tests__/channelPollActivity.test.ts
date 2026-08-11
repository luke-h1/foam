import { twitchService } from '@app/services/twitch-service';
import type { ChannelPollState } from '@app/types/twitch/poll';
import {
  createEventSubPoll,
  createHelixPoll,
} from '@app/utils/twitch/channelActivity/__tests__/__fixtures__/channelPollActivity.fixture';
import { channelPollActivity } from '@app/utils/twitch/channelActivity/channelPollActivity';

jest.mock('@app/services/twitch-service', () => ({
  twitchService: {
    getPolls: jest.fn(),
  },
}));

const mockGetPolls = jest.mocked(twitchService.getPolls);

function getNormaliser(type: string) {
  const entry = channelPollActivity.events.find(event => event.type === type);
  if (!entry) {
    throw new Error(`channelPollActivity has no event for ${type}`);
  }
  return entry.normalise;
}

describe('channelPollActivity', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('fetches the newest poll for the broadcaster', async () => {
    mockGetPolls.mockResolvedValue({ data: [] });

    await channelPollActivity.fetch('channel-id');

    expect(mockGetPolls).toHaveBeenCalledWith({
      broadcasterId: 'channel-id',
      first: 1,
    });
  });

  test('lists the poll lifecycle event types', () => {
    expect(channelPollActivity.events.map(event => event.type)).toEqual([
      'channel.poll.begin',
      'channel.poll.progress',
      'channel.poll.end',
    ]);
  });

  test('treats only active polls as active', () => {
    const active = channelPollActivity.normaliseHelix(
      createHelixPoll({ status: 'ACTIVE' }),
    );
    const completed = channelPollActivity.normaliseHelix(
      createHelixPoll({ status: 'COMPLETED' }),
    );

    expect(channelPollActivity.isActive(active)).toBe(true);
    expect(channelPollActivity.isActive(completed)).toBe(false);
  });

  test('normalises begin events as active', () => {
    const state = getNormaliser('channel.poll.begin')(createEventSubPoll());

    expect(state).toEqual<ChannelPollState>({
      id: 'poll-1',
      broadcasterId: 'channel-id',
      broadcasterLogin: 'streamer',
      broadcasterName: 'Streamer',
      title: 'Best snack?',
      choices: [
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
      ],
      totalVotes: 4,
      channelPointsVotingEnabled: true,
      channelPointsPerVote: 200,
      startedAt: '2026-05-09T10:00:00Z',
      endsAt: '2026-05-09T10:02:00Z',
      status: 'active',
      isActive: true,
    });
  });

  test('normalises progress events as active', () => {
    const state = getNormaliser('channel.poll.progress')(createEventSubPoll());

    expect({ status: state.status, isActive: state.isActive }).toEqual({
      status: 'active',
      isActive: true,
    });
  });

  test('normalises end events with a completed fallback', () => {
    const normalise = getNormaliser('channel.poll.end');

    const ended = normalise(createEventSubPoll());
    const terminated = normalise(createEventSubPoll({ status: 'terminated' }));

    expect({ status: ended.status, isActive: ended.isActive }).toEqual({
      status: 'completed',
      isActive: false,
    });
    expect(terminated.status).toBe('terminated');
  });

  test('reports fetch failures with poll log fields', () => {
    expect(channelPollActivity.fetchFailure).toEqual({
      message: 'Failed to fetch initial Twitch poll state',
      name: 'twitch_polls_warning',
      action: 'initial_poll_fetch_failed',
    });
  });
});
