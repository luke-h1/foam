import {
  eventSubEventFromMessage,
  parseChannelPointsEventSubEvent,
} from '../parseChannelPointsEventSub';

describe('parseChannelPointsEventSub', () => {
  test('parses custom reward redemption event', () => {
    expect(
      parseChannelPointsEventSubEvent({
        broadcaster_user_id: '67890',
        reward: {
          id: 'reward-tts',
          title: 'Chinese TTS',
          cost: 500,
        },
      }),
    ).toEqual({
      rewardId: 'reward-tts',
      channelId: '67890',
      title: 'Chinese TTS',
    });
  });

  test('parses automatic reward redemption event', () => {
    expect(
      parseChannelPointsEventSubEvent({
        broadcaster_user_id: '67890',
        reward: {
          type: 'SEND_GIGANTIFIED_EMOTE',
          title: '',
          cost: 100,
        },
      }),
    ).toEqual({
      rewardId: 'gigantified-emote-message',
      channelId: '67890',
      title: 'Gigantify an Emote',
    });
  });

  test('eventSubEventFromMessage reads payload.event', () => {
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

  test('eventSubEventFromMessage prefers top-level event', () => {
    expect(
      eventSubEventFromMessage({
        event: { id: 'top-level' },
        payload: { event: { id: 'payload-level' } },
      }),
    ).toEqual({ id: 'top-level' });
  });
});
