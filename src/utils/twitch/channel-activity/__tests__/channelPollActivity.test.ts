import { createEventSubPoll } from '@app/utils/twitch/channel-activity/__tests__/__fixtures__/channelPollActivity.fixture';
import { channelPollActivity } from '@app/utils/twitch/channel-activity/channelPollActivity';

function getNormaliser(type: string) {
  const entry = channelPollActivity.events.find(event => event.type === type);

  if (!entry) {
    throw new Error(`channelPollActivity has no event for ${type}`);
  }

  return entry.normalise;
}

describe('channelPollActivity', () => {
  test('normalises begin events as active', () => {
    const state = getNormaliser('channel.poll.begin')(createEventSubPoll());

    expect({ status: state.status, isActive: state.isActive }).toEqual({
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
});
