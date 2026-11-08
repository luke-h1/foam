import type {
  ChannelPredictionOutcomeState,
  ChannelPredictionState,
} from '@app/types/twitch/prediction';
import {
  createEventSubPrediction,
  createHelixPrediction,
} from '@app/utils/twitch/channel-activity/__tests__/__fixtures__/channelPredictionActivity.fixture';

import {
  normaliseEventSubPrediction,
  normaliseHelixPrediction,
} from '../normalisePrediction';

function outcomes(winnerId?: string): ChannelPredictionOutcomeState[] {
  return [
    {
      id: 'outcome-a',
      title: 'Yes',
      color: 'blue',
      users: 3,
      channelPoints: 300,
      percentage: 75,
      isWinner: winnerId === 'outcome-a',
    },
    {
      id: 'outcome-b',
      title: 'No',
      color: 'pink',
      users: 1,
      channelPoints: 100,
      percentage: 25,
      isWinner: winnerId === 'outcome-b',
    },
  ];
}

describe('normalisePrediction', () => {
  test('normalises a helix prediction and derives locksAt from the window', () => {
    expect(
      normaliseHelixPrediction(createHelixPrediction()),
    ).toEqual<ChannelPredictionState>({
      id: 'prediction-1',
      broadcasterId: 'channel-id',
      broadcasterLogin: 'streamer',
      broadcasterName: 'Streamer',
      title: 'Will we win?',
      outcomes: outcomes(),
      totalUsers: 4,
      totalChannelPoints: 400,
      predictionWindowSeconds: 300,
      startedAt: '2026-05-09T10:00:00Z',
      locksAt: '2026-05-09T10:05:00.000Z',
      status: 'active',
      isActive: true,
      isLocked: false,
    });
  });

  test('normalises an eventsub prediction and marks the winning outcome', () => {
    expect(
      normaliseEventSubPrediction(
        createEventSubPrediction({
          ended_at: '2026-05-09T10:01:00Z',
          winning_outcome_id: 'outcome-a',
        }),
        'resolved',
      ),
    ).toEqual<ChannelPredictionState>({
      id: 'prediction-1',
      broadcasterId: 'channel-id',
      broadcasterLogin: 'streamer',
      broadcasterName: 'Streamer',
      title: 'Will we win?',
      outcomes: outcomes('outcome-a'),
      totalUsers: 4,
      totalChannelPoints: 400,
      startedAt: '2026-05-09T10:00:00Z',
      locksAt: '2026-05-09T10:05:00Z',
      endedAt: '2026-05-09T10:01:00Z',
      winningOutcomeId: 'outcome-a',
      status: 'resolved',
      isActive: false,
      isLocked: false,
    });
  });
});
