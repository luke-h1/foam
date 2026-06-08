import { recordWarning } from '@app/lib/sentry';
import { twitchService } from '@app/services/twitch-service';
import TwitchWsService from '@app/services/twitch-ws-service';

jest.mock('@app/services/twitch-service', () => ({
  twitchService: {
    createEventSubscription: jest.fn(),
    deleteEventSubscription: jest.fn(),
    listEventSubscriptions: jest.fn(),
  },
}));

jest.mock('@app/lib/sentry', () => ({
  recordInfo: jest.fn(),
  recordWarning: jest.fn(),
}));

jest.mock('@app/utils/logger', () => ({
  logger: {
    twitchWs: {
      error: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
    },
  },
}));

import {
  getTwitchWsTestState,
  resetTwitchWsTestState,
} from './__fixtures__/twitchWsService.fixture';

const twitchWsState = getTwitchWsTestState();
const mockCreateEventSubscription = jest.mocked(
  twitchService.createEventSubscription,
);
const mockRecordWarning = jest.mocked(recordWarning);

describe('TwitchWsService EventSub response handling', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetTwitchWsTestState(twitchWsState);
  });

  test('does not treat Twitch API error bodies as subscription responses', async () => {
    const callback = jest.fn((_: unknown) => undefined);
    mockCreateEventSubscription.mockResolvedValue({
      message: 'Forbidden',
      status: 403,
    } as unknown as Awaited<ReturnType<typeof mockCreateEventSubscription>>);

    await TwitchWsService.subscribeToEvent(
      'channel.prediction.begin',
      '1',
      { broadcaster_user_id: 'channel-id' },
      callback,
    );

    expect(
      twitchWsState.activeSubscriptions.has('channel.prediction.begin'),
    ).toBe(false);
    expect(
      twitchWsState.eventCallbacks.get('channel.prediction.begin'),
    ).toEqual([]);
    expect(mockCreateEventSubscription).toHaveBeenCalledTimes(1);
    const warningPayload = mockRecordWarning.mock.calls[0]?.[0];
    expect({
      action: warningPayload?.params?.action,
      event_type: warningPayload?.params?.event_type,
    }).toEqual({
      action: 'subscription_create_failed',
      event_type: 'channel.prediction.begin',
    });
  });
});
