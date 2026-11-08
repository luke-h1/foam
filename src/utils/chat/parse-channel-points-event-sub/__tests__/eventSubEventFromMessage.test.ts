import { eventSubEventFromMessage } from '../eventSubEventFromMessage';

describe('eventSubEventFromMessage', () => {
  test('reads payload.event', () => {
    const event = {
      broadcaster_user_id: '67890',
      reward: { id: 'reward-1', title: 'Hydrate' },
    };

    expect(
      eventSubEventFromMessage({
        payload: { event },
      }),
    ).toEqual(event);
  });

  test('prefers the top-level event', () => {
    expect(
      eventSubEventFromMessage({
        event: { id: 'top-level' },
        payload: { event: { id: 'payload-level' } },
      }),
    ).toEqual({ id: 'top-level' });
  });
});
