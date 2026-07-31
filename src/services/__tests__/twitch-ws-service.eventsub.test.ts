import { twitchService } from '@app/services/twitch-service';
import TwitchWsService from '@app/services/twitch-ws-service';
import { logger } from '@app/utils/logger';

jest.mock('@app/services/twitch-service', () => ({
  twitchService: {
    createEventSubscription: jest.fn(),
    deleteEventSubscription: jest.fn(),
    listEventSubscriptions: jest.fn(),
  },
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
  createFakeSocket,
  getTwitchWsTestState,
  resetTwitchWsTestState,
} from './__fixtures__/twitchWsService.fixture';

const twitchWsState = getTwitchWsTestState();
const mockCreateEventSubscription = jest.mocked(
  twitchService.createEventSubscription,
);
const mockDeleteEventSubscription = jest.mocked(
  twitchService.deleteEventSubscription,
);
const mockWarn = jest.mocked(logger.twitchWs.warn);

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
    const warningPayload = mockWarn.mock.calls[0]?.[1] as
      Record<string, unknown> | undefined;
    expect({
      action: warningPayload?.action,
      event_type: warningPayload?.event_type,
    }).toEqual({
      action: 'subscription_create_failed',
      event_type: 'channel.prediction.begin',
    });
  });
});

describe('TwitchWsService shared socket teardown', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    resetTwitchWsTestState(twitchWsState);
    mockDeleteEventSubscription.mockResolvedValue(
      undefined as unknown as Awaited<
        ReturnType<typeof mockDeleteEventSubscription>
      >,
    );
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  async function subscribe(eventType: string, callback: jest.Mock) {
    mockCreateEventSubscription.mockResolvedValue({
      data: [{ id: `${eventType}-sub-id` }],
    } as unknown as Awaited<ReturnType<typeof mockCreateEventSubscription>>);

    await TwitchWsService.subscribeToEvent(
      eventType,
      '1',
      { broadcaster_user_id: 'channel-id' },
      callback,
    );
  }

  test('keeps the socket open while another consumer is still subscribed', async () => {
    const socket = createFakeSocket();
    const onPoll = jest.fn();
    const onRedemption = jest.fn();

    await subscribe('channel.poll.begin', onPoll);
    await subscribe(
      'channel.channel_points_custom_reward_redemption.add',
      onRedemption,
    );
    twitchWsState.instance = socket;

    await TwitchWsService.unsubscribeFromEvent('channel.poll.begin', onPoll);

    expect(socket.close).not.toHaveBeenCalled();
    expect(twitchWsState.instance).toBe(socket);
  });

  test('closes the socket once the last consumer unsubscribes', async () => {
    const socket = createFakeSocket();
    const onPoll = jest.fn();
    const onRedemption = jest.fn();

    await subscribe('channel.poll.begin', onPoll);
    await subscribe(
      'channel.channel_points_custom_reward_redemption.add',
      onRedemption,
    );
    twitchWsState.instance = socket;

    await TwitchWsService.unsubscribeFromEvent('channel.poll.begin', onPoll);
    await TwitchWsService.unsubscribeFromEvent(
      'channel.channel_points_custom_reward_redemption.add',
      onRedemption,
    );

    expect(socket.close).toHaveBeenCalledWith(1000, 'Manual Disconnect');
    expect(twitchWsState.instance).toBeNull();
  });

  test('cancels a pending reconnect when the last consumer leaves', async () => {
    const socket = createFakeSocket();
    const onPoll = jest.fn();

    await subscribe('channel.poll.begin', onPoll);
    twitchWsState.instance = socket;

    // The socket drops and arms the backoff reconnect.
    twitchWsState.attemptReconnect();
    expect(twitchWsState.reconnectTimer).not.toBeNull();

    await TwitchWsService.unsubscribeFromEvent('channel.poll.begin', onPoll);

    expect(twitchWsState.reconnectTimer).toBeNull();
    expect(twitchWsState.isReconnecting).toBe(false);

    // The orphaned timer would have reopened the socket here.
    jest.advanceTimersByTime(10_000);
    expect(twitchWsState.instance).toBeNull();
  });
});
