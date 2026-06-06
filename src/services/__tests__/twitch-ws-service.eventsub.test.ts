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

type EventCallback = (data: unknown) => void;
type TwitchWsPrivateState = {
  activeSubscriptions: Map<string, string>;
  eventCallbacks: Map<string, EventCallback[]>;
  instance: WebSocket | null;
  sessionId: string;
  subscriptionConfigs: Map<
    string,
    { condition: Record<string, string>; version: string }
  >;
};

const twitchWsState = TwitchWsService as unknown as TwitchWsPrivateState;
const mockCreateEventSubscription = jest.mocked(
  twitchService.createEventSubscription,
);
const mockRecordWarning = jest.mocked(recordWarning);

describe('TwitchWsService EventSub response handling', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    twitchWsState.activeSubscriptions = new Map();
    twitchWsState.eventCallbacks = new Map();
    twitchWsState.instance = null;
    twitchWsState.sessionId = 'session-id';
    twitchWsState.subscriptionConfigs = new Map();
  });

  test('does not treat Twitch API error bodies as subscription responses', async () => {
    const callback = jest.fn((_: unknown) => undefined);
    mockCreateEventSubscription.mockResolvedValue({
      message: 'Forbidden',
      status: 403,
    } as unknown as Awaited<
      ReturnType<typeof twitchService.createEventSubscription>
    >);

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
