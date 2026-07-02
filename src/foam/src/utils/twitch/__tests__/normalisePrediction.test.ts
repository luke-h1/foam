import {
  normaliseEventSubPrediction,
  normaliseHelixPrediction,
} from '../normalisePrediction';

describe('normalisePrediction', () => {
  test('normalises helix predictions with point percentages', () => {
    const result = normaliseHelixPrediction({
      id: 'prediction-1',
      broadcaster_id: '1',
      broadcaster_login: 'foo',
      broadcaster_name: 'Foo',
      title: 'Win the next round?',
      winning_outcome_id: null,
      outcomes: [
        {
          id: 'blue',
          title: 'Yes',
          color: 'BLUE',
          users: 5,
          channel_points: 400,
          top_predictors: null,
        },
        {
          id: 'pink',
          title: 'No',
          color: 'PINK',
          users: 3,
          channel_points: 100,
          top_predictors: null,
        },
      ],
      prediction_window: 120,
      status: 'ACTIVE',
      created_at: '2026-05-09T10:00:00Z',
      ended_at: null,
      locked_at: null,
    });

    expect(result.totalUsers).toBe(8);
    expect(result.totalChannelPoints).toBe(500);
    expect(result.outcomes[0]?.percentage).toBe(80);
    expect(result.outcomes[1]?.percentage).toBe(20);
    expect(result.status).toBe('active');
  });

  test('normalises eventsub winner state', () => {
    const result = normaliseEventSubPrediction(
      {
        id: 'prediction-2',
        broadcaster_user_id: '1',
        broadcaster_user_login: 'foo',
        broadcaster_user_name: 'Foo',
        title: 'Boss clear?',
        outcomes: [
          {
            id: 'win',
            title: 'Clear',
            color: 'BLUE',
            users: 10,
            channel_points: 2500,
            top_predictors: null,
          },
          {
            id: 'lose',
            title: 'Fail',
            color: 'PINK',
            users: 4,
            channel_points: 600,
            top_predictors: null,
          },
        ],
        started_at: '2026-05-09T10:00:00Z',
        ended_at: '2026-05-09T10:01:00Z',
        status: 'resolved',
        winning_outcome_id: 'win',
      },
      'resolved',
    );

    expect(result.status).toBe('resolved');
    expect(result.isActive).toBe(false);
    expect(result.outcomes[0]?.isWinner).toBe(true);
    expect(result.outcomes[1]?.isWinner).toBe(false);
  });
});
