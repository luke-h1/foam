import { AppState, type AppStateStatus } from 'react-native';

import { twitchService } from '@app/services/twitch-service';
import TwitchWsService from '@app/services/twitch-ws-service';
import type { EventSubMessage } from '@app/types/twitch/eventsub';
import { logger } from '@app/utils/logger';

import {
  createFakeSocket,
  getTwitchWsTestState,
  resetTwitchWsTestState,
} from './__fixtures__/twitchWsService.fixture';

const twitchWsState = getTwitchWsTestState();
const mockCreateEventSubscription = jest.spyOn(
  twitchService,
  'createEventSubscription',
);
const mockDeleteEventSubscription = jest.spyOn(
  twitchService,
  'deleteEventSubscription',
);
jest.spyOn(logger.twitchWs, 'error').mockImplementation(() => {});
jest.spyOn(logger.twitchWs, 'info').mockImplementation(() => {});
const mockWarn = jest
  .spyOn(logger.twitchWs, 'warn')
  .mockImplementation(() => {});

type CreateEventSubscriptionResponse = Awaited<
  ReturnType<typeof twitchService.createEventSubscription>
>;

interface TwitchApiErrorBody {
  message: string;
  status: number;
}

function unvalidatedCreateResponse(
  body: CreateEventSubscriptionResponse | TwitchApiErrorBody,
): CreateEventSubscriptionResponse {
  // SAFETY: the HTTP client returns parsed JSON unvalidated, so a Twitch error body reaches callers typed as the subscription response
  return body as CreateEventSubscriptionResponse;
}

function createSubscriptionResponse(
  subscriptionId: string,
  eventType: string,
): CreateEventSubscriptionResponse {
  return {
    data: [
      {
        id: subscriptionId,
        status: 'enabled',
        type: eventType,
        version: '1',
        condition: {},
        created_at: '2026-01-01T00:00:00.000Z',
        transport: {},
        method: 'websocket',
        callback: '',
        session_id: 'session-id',
        cost: 1,
      },
    ],
    total: 1,
    total_cost: 1,
    max_total_cost: 10,
  };
}

function createNotification(
  subscriptionType: string,
  condition: Record<string, string>,
): EventSubMessage {
  return {
    metadata: {
      message_id: 'message-id',
      message_type: 'notification',
      message_timestamp: '2026-01-01T00:00:00.000Z',
      subscription_type: subscriptionType,
    },
    payload: {
      subscription: {
        id: 'sub-other',
        status: 'enabled',
        type: subscriptionType,
        version: '1',
        condition,
        transport: {
          method: 'websocket',
          session_id: 'session-id',
        },
        created_at: '2026-01-01T00:00:00.000Z',
      },
    },
  };
}

describe('TwitchWsService EventSub response handling', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetTwitchWsTestState(twitchWsState);
  });

  test('does not treat Twitch API error bodies as subscription responses', async () => {
    const callback = jest.fn();
    mockCreateEventSubscription.mockResolvedValue(
      unvalidatedCreateResponse({ message: 'Forbidden', status: 403 }),
    );

    await TwitchWsService.subscribeToEvent(
      'channel.prediction.begin',
      '1',
      { broadcaster_user_id: 'channel-id' },
      callback,
    );

    expect(twitchWsState.entries.size).toBe(0);
    expect(mockCreateEventSubscription).toHaveBeenCalledTimes(1);
    expect(mockWarn.mock.calls).toEqual([
      [
        'Failed to subscribe to Twitch EventSub event channel.prediction.begin',
        {
          name: 'twitch_ws_warning',
          error: new Error(
            'Twitch EventSub channel.prediction.begin subscription returned no subscription data',
          ),
          action: 'subscription_create_failed',
          event_type: 'channel.prediction.begin',
          provider: 'twitch',
          source: 'twitch_ws_service',
        },
      ],
    ]);
  });
});

describe('TwitchWsService shared socket teardown', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    resetTwitchWsTestState(twitchWsState);
    mockDeleteEventSubscription.mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  async function subscribe(eventType: string, callback: jest.Mock) {
    mockCreateEventSubscription.mockResolvedValue(
      createSubscriptionResponse(`${eventType}-sub-id`, eventType),
    );

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

  test('deletes each subscription once when event types unsubscribe together', async () => {
    const socket = createFakeSocket();
    const onBegin = jest.fn();
    const onEnd = jest.fn();

    await subscribe('channel.poll.begin', onBegin);
    await subscribe('channel.poll.end', onEnd);
    twitchWsState.instance = socket;

    // The unmount path in useChannelPoll / useChannelPrediction: several event
    // types torn down through one Promise.all rather than sequentially.
    let resolveBegin: () => void = () => {};
    mockDeleteEventSubscription.mockImplementation(id =>
      id === 'channel.poll.begin-sub-id'
        ? new Promise(resolve => {
            resolveBegin = () => resolve(undefined);
          })
        : Promise.resolve(undefined),
    );

    const unsubscribed = Promise.all([
      TwitchWsService.unsubscribeFromEvent('channel.poll.begin', onBegin),
      TwitchWsService.unsubscribeFromEvent('channel.poll.end', onEnd),
    ]);

    // Let the sibling settle and run teardown while the first delete is still
    // in flight, then release it.
    await Promise.resolve();
    resolveBegin();
    await unsubscribed;

    expect(mockDeleteEventSubscription.mock.calls.map(([id]) => id)).toEqual([
      'channel.poll.begin-sub-id',
      'channel.poll.end-sub-id',
    ]);
  });

  test('holds one subscription per condition and tears them down independently', async () => {
    const socket = createFakeSocket();
    const onChannelOne = jest.fn();
    const onChannelTwo = jest.fn();

    mockCreateEventSubscription.mockResolvedValueOnce(
      createSubscriptionResponse('sub-channel-1', 'channel.poll.begin'),
    );
    await TwitchWsService.subscribeToEvent(
      'channel.poll.begin',
      '1',
      { broadcaster_user_id: '1' },
      onChannelOne,
    );

    mockCreateEventSubscription.mockResolvedValueOnce(
      createSubscriptionResponse('sub-channel-2', 'channel.poll.begin'),
    );
    await TwitchWsService.subscribeToEvent(
      'channel.poll.begin',
      '1',
      { broadcaster_user_id: '2' },
      onChannelTwo,
    );
    twitchWsState.instance = socket;

    expect(mockCreateEventSubscription).toHaveBeenCalledTimes(2);

    await TwitchWsService.unsubscribeFromEvent(
      'channel.poll.begin',
      onChannelOne,
    );

    expect(mockDeleteEventSubscription.mock.calls.map(([id]) => id)).toEqual([
      'sub-channel-1',
    ]);
    const remaining = Array.from(twitchWsState.entries.values());
    expect(
      remaining.map(entry => ({
        condition: entry.condition,
        subscriptionId: entry.subscriptionId,
      })),
    ).toEqual([
      {
        condition: { broadcaster_user_id: '2' },
        subscriptionId: 'sub-channel-2',
      },
    ]);
    expect(socket.close).not.toHaveBeenCalled();
  });

  test('routes a notification to the entry whose condition it carries', async () => {
    const onChannelOne = jest.fn();
    const onChannelTwo = jest.fn();

    await subscribe('channel.poll.begin', onChannelOne);
    mockCreateEventSubscription.mockResolvedValueOnce(
      createSubscriptionResponse('sub-other', 'channel.poll.begin'),
    );
    await TwitchWsService.subscribeToEvent(
      'channel.poll.begin',
      '1',
      { broadcaster_user_id: 'other-channel' },
      onChannelTwo,
    );

    twitchWsState.handleNotification(
      createNotification('channel.poll.begin', {
        broadcaster_user_id: 'other-channel',
      }),
    );

    expect(onChannelOne).not.toHaveBeenCalled();
    expect(onChannelTwo).toHaveBeenCalledTimes(1);
  });

  test('revives the socket on foreground when consumers are still subscribed', async () => {
    const listeners: ((state: AppStateStatus) => void)[] = [];
    const appStateSpy = jest
      .spyOn(AppState, 'addEventListener')
      .mockImplementation((_type, handler) => {
        listeners.push(handler);
        return { remove: jest.fn() };
      });

    const onPoll = jest.fn();
    await subscribe('channel.poll.begin', onPoll);

    twitchWsState.instance = null;
    twitchWsState.sessionId = '';

    listeners.forEach(listener => listener('active'));

    expect(twitchWsState.reconnectTimer).not.toBeNull();

    appStateSpy.mockRestore();
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
