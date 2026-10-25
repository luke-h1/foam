import type { ChannelPredictionState } from '@app/types/twitch/prediction';
import {
  createEventSubPrediction,
  createHelixPrediction,
} from '@app/utils/twitch/channel-activity/__tests__/__fixtures__/channel-prediction-activity.fixture';
import { channelPredictionActivity } from '@app/utils/twitch/channel-activity/channel-prediction-activity';

function getNormaliser(type: string) {
  const entry = channelPredictionActivity.events.find(
    event => event.type === type,
  );

  if (!entry) {
    throw new Error(`channelPredictionActivity has no event for ${type}`);
  }

  return entry.normalise;
}

describe('channelPredictionActivity', () => {
  test('treats active and locked predictions as active', () => {
    const active = channelPredictionActivity.normaliseHelix(
      createHelixPrediction({ status: 'ACTIVE' }),
    );

    const locked = channelPredictionActivity.normaliseHelix(
      createHelixPrediction({ status: 'LOCKED' }),
    );

    const resolved = channelPredictionActivity.normaliseHelix(
      createHelixPrediction({ status: 'RESOLVED' }),
    );

    expect(channelPredictionActivity.isActive(active)).toBe(true);

    expect(channelPredictionActivity.isActive(locked)).toBe(true);

    expect(channelPredictionActivity.isActive(resolved)).toBe(false);
  });

  test('normalises begin events as active', () => {
    const state = getNormaliser('channel.prediction.begin')(
      createEventSubPrediction(),
    );

    expect(state).toEqual<ChannelPredictionState>({
      id: 'prediction-1',
      broadcasterId: 'channel-id',
      broadcasterLogin: 'streamer',
      broadcasterName: 'Streamer',
      title: 'Will we win?',
      outcomes: [
        {
          id: 'outcome-a',
          title: 'Yes',
          color: 'blue',
          users: 3,
          channelPoints: 300,
          percentage: 75,
          isWinner: false,
        },
        {
          id: 'outcome-b',
          title: 'No',
          color: 'pink',
          users: 1,
          channelPoints: 100,
          percentage: 25,
          isWinner: false,
        },
      ],
      totalUsers: 4,
      totalChannelPoints: 400,
      startedAt: '2026-05-09T10:00:00Z',
      locksAt: '2026-05-09T10:05:00Z',
      status: 'active',
      isActive: true,
      isLocked: false,
    });
  });

  test('normalises progress events as active', () => {
    const state = getNormaliser('channel.prediction.progress')(
      createEventSubPrediction(),
    );

    expect({ status: state.status, isActive: state.isActive }).toEqual({
      status: 'active',
      isActive: true,
    });
  });

  test('normalises lock events with a locked fallback', () => {
    const state = getNormaliser('channel.prediction.lock')(
      createEventSubPrediction(),
    );

    expect({ status: state.status, isLocked: state.isLocked }).toEqual({
      status: 'locked',
      isLocked: true,
    });
  });

  test('normalises end events with a resolved fallback', () => {
    const normalise = getNormaliser('channel.prediction.end');

    const resolved = normalise(createEventSubPrediction());

    const canceled = normalise(
      createEventSubPrediction({ status: 'canceled' }),
    );

    expect({ status: resolved.status, isActive: resolved.isActive }).toEqual({
      status: 'resolved',
      isActive: false,
    });

    expect(canceled.status).toBe('canceled');
  });
});
