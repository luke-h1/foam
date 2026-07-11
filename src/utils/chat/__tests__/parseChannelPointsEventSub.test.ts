import type { ParsedChannelPointsRedemption } from '../parseChannelPointsEventSub';
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
    ).toEqual<ParsedChannelPointsRedemption>({
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
    ).toEqual<ParsedChannelPointsRedemption>({
      rewardId: 'gigantified-emote-message',
      channelId: '67890',
      title: 'Gigantify an Emote',
    });
  });

  test('returns undefined when the reward is missing', () => {
    expect(
      parseChannelPointsEventSubEvent({ broadcaster_user_id: '67890' }),
    ).toBeUndefined();
  });

  test('returns undefined when the reward is not an object', () => {
    expect(
      parseChannelPointsEventSubEvent({
        broadcaster_user_id: '67890',
        reward: 'reward-tts',
      }),
    ).toBeUndefined();
  });

  test('returns undefined when the channel id is missing', () => {
    expect(
      parseChannelPointsEventSubEvent({
        reward: { id: 'reward-tts', title: 'Chinese TTS' },
      }),
    ).toBeUndefined();
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
