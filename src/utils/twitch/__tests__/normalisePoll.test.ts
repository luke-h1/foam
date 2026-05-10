import { normaliseEventSubPoll, normaliseHelixPoll } from '../normalisePoll';

describe('normalisePoll', () => {
  test('normalises helix polls with percentages', () => {
    const result = normaliseHelixPoll({
      id: 'poll-1',
      broadcaster_id: '1',
      broadcaster_login: 'foo',
      broadcaster_name: 'Foo',
      title: 'Best snack?',
      choices: [
        {
          id: 'a',
          title: 'Crisps',
          votes: 3,
          channel_points_votes: 1,
          bits_votes: 0,
        },
        {
          id: 'b',
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
    });

    expect(result.totalVotes).toBe(4);
    expect(result.status).toBe('active');
    expect(result.isActive).toBe(true);
    expect(result.choices[0]?.percentage).toBe(75);
    expect(result.choices[1]?.percentage).toBe(25);
  });

  test('normalises eventsub end payloads', () => {
    const result = normaliseEventSubPoll(
      {
        id: 'poll-2',
        broadcaster_user_id: '1',
        broadcaster_user_login: 'foo',
        broadcaster_user_name: 'Foo',
        title: 'Best drink?',
        choices: [
          {
            id: 'a',
            title: 'Tea',
            votes: 8,
            channel_points_votes: 2,
            bits_votes: 0,
          },
          {
            id: 'b',
            title: 'Coffee',
            votes: 2,
            channel_points_votes: 0,
            bits_votes: 0,
          },
        ],
        channel_points_voting: {
          is_enabled: true,
          amount_per_vote: 50,
        },
        started_at: '2026-05-09T10:00:00Z',
        ended_at: '2026-05-09T10:01:00Z',
        status: 'completed',
      },
      'completed',
    );

    expect(result.status).toBe('completed');
    expect(result.isActive).toBe(false);
    expect(result.totalVotes).toBe(10);
    expect(result.choices[0]?.percentage).toBe(80);
  });
});
