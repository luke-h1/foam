import { AppState, type AppStateStatus } from 'react-native';

import { ApiError } from '@app/services/api/client';
import { twitchService } from '@app/services/twitch-service';
import TwitchWsService from '@app/services/twitch-ws-service';
import { silenceLogger } from '@app/test/silence-logger';
import type { EventSubMessage } from '@app/types/twitch/eventsub';
import { logger } from '@app/utils/logger';

import {
  createFakeSocket,
  resetTwitchWsTestState,
} from './__fixtures__/twitch-ws-service.fixture';

const sockets: WebSocket[] = [];

jest.spyOn(global, 'WebSocket').mockImplementation(() => {
  const socket = createFakeSocket();
  sockets.push(socket);
  return socket;
});

const mockCreateEventSubscription = jest.spyOn(
  twitchService,
  'createEventSubscription',
);

const mockDeleteEventSubscription = jest.spyOn(
  twitchService,
  'deleteEventSubscription',
);

silenceLogger();

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

function deliver(socket: WebSocket, message: EventSubMessage) {
  // SAFETY: the service reads only `data` off a message event.
  socket.onmessage?.({ data: JSON.stringify(message) } as MessageEvent);
}

function sessionMessage(
  messageType: 'session_welcome' | 'session_reconnect',
  sessionId: string,
): EventSubMessage {
  const session = {
    id: sessionId,
    status: 'connected',
    keepalive_timeout_seconds: 10,
    connected_at: '2026-01-01T00:00:00.000Z',
  };

  return {
    metadata: {
      message_id: `${messageType}-${sessionId}`,
      message_type: messageType,
      message_timestamp: '2026-01-01T00:00:00.000Z',
    },
    payload: {
      session:
        messageType === 'session_reconnect'
          ? {
              ...session,
              reconnect_url: 'wss://eventsub.wss.twitch.tv/ws?reconnect',
            }
          : session,
    },
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
    resetTwitchWsTestState();
    sockets.length = 0;
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

  test('does not warn again for an API error the client already logged', async () => {
    mockCreateEventSubscription.mockRejectedValue(
      new ApiError('Forbidden', 403, 'TwitchApiError'),
    );

    await TwitchWsService.subscribeToEvent(
      'channel.prediction.begin',
      '1',
      { broadcaster_user_id: 'channel-id' },
      jest.fn(),
    );

    expect(mockCreateEventSubscription).toHaveBeenCalledTimes(1);

    expect(mockWarn.mock.calls).toEqual([]);
  });
});

describe('TwitchWsService shared socket teardown', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    resetTwitchWsTestState();
    sockets.length = 0;
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
    const onPoll = jest.fn();
    const onRedemption = jest.fn();

    await subscribe('channel.poll.begin', onPoll);

    await subscribe(
      'channel.channel_points_custom_reward_redemption.add',
      onRedemption,
    );

    const socket = TwitchWsService.getInstance();

    await TwitchWsService.unsubscribeFromEvent('channel.poll.begin', onPoll);

    expect(socket.close).not.toHaveBeenCalled();

    expect(TwitchWsService.getInstance()).toBe(socket);
  });

  test('closes the socket once the last consumer unsubscribes', async () => {
    const onPoll = jest.fn();
    const onRedemption = jest.fn();

    await subscribe('channel.poll.begin', onPoll);

    await subscribe(
      'channel.channel_points_custom_reward_redemption.add',
      onRedemption,
    );

    const socket = TwitchWsService.getInstance();

    await TwitchWsService.unsubscribeFromEvent('channel.poll.begin', onPoll);

    await TwitchWsService.unsubscribeFromEvent(
      'channel.channel_points_custom_reward_redemption.add',
      onRedemption,
    );

    expect(jest.mocked(socket.close).mock.calls).toEqual([
      [1000, 'Manual Disconnect'],
    ]);

    expect(TwitchWsService.getInstance()).not.toBe(socket);
  });

  test('deletes each subscription once when event types unsubscribe together', async () => {
    const onBegin = jest.fn();
    const onEnd = jest.fn();

    await subscribe('channel.poll.begin', onBegin);
    await subscribe('channel.poll.end', onEnd);

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

    const socket = TwitchWsService.getInstance();

    expect(mockCreateEventSubscription).toHaveBeenCalledTimes(2);

    await TwitchWsService.unsubscribeFromEvent(
      'channel.poll.begin',
      onChannelOne,
    );

    expect(mockDeleteEventSubscription.mock.calls.map(([id]) => id)).toEqual([
      'sub-channel-1',
    ]);

    expect(socket.close).not.toHaveBeenCalled();

    await TwitchWsService.unsubscribeFromEvent(
      'channel.poll.begin',
      onChannelTwo,
    );

    expect(mockDeleteEventSubscription.mock.calls.map(([id]) => id)).toEqual([
      'sub-channel-1',
      'sub-channel-2',
    ]);
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

    deliver(
      TwitchWsService.getInstance(),
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

    TwitchWsService.sessionId = '';

    listeners.forEach(listener => listener('active'));
    jest.advanceTimersByTime(0);

    expect(sockets).toHaveLength(1);

    appStateSpy.mockRestore();
  });

  test('a keepalive timeout replaces the dead socket with exactly one new socket', async () => {
    TwitchWsService.sessionId = '';
    await subscribe('channel.poll.begin', jest.fn());

    const [socket] = sockets;
    deliver(socket!, sessionMessage('session_welcome', 'first'));

    jest.advanceTimersByTime(15_000);

    expect(jest.mocked(socket!.close).mock.calls).toEqual([
      [1000, 'Replaced by a new EventSub connection'],
    ]);

    expect(socket!.onclose).toBeNull();

    jest.advanceTimersByTime(60_000);

    expect(sockets).toHaveLength(2);
  });

  test('cancels a pending reconnect when the last consumer leaves', async () => {
    const onPoll = jest.fn();

    TwitchWsService.sessionId = '';
    await subscribe('channel.poll.begin', onPoll);

    const [socket] = sockets;

    // SAFETY: the service reads only `code` and `reason` off a close event.
    socket!.onclose?.({ code: 1006, reason: '', timeStamp: 0 } as CloseEvent);

    await TwitchWsService.unsubscribeFromEvent('channel.poll.begin', onPoll);

    // The orphaned timer would have reopened the socket here.
    jest.advanceTimersByTime(60_000);

    expect(sockets).toHaveLength(1);
  });
});

describe('TwitchWsService session_reconnect', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    resetTwitchWsTestState();
    sockets.length = 0;
  });

  afterEach(() => {
    resetTwitchWsTestState();
    jest.useRealTimers();
  });

  test('keeps the subscriptions and the old socket until the new socket welcomes', async () => {
    mockCreateEventSubscription.mockResolvedValue(
      createSubscriptionResponse('poll-sub-id', 'channel.poll.begin'),
    );

    await TwitchWsService.subscribeToEvent(
      'channel.poll.begin',
      '1',
      { broadcaster_user_id: 'channel-id' },
      jest.fn(),
    );

    const oldSocket = TwitchWsService.getInstance();
    mockCreateEventSubscription.mockClear();

    deliver(oldSocket, sessionMessage('session_reconnect', 'old'));

    expect(sockets).toHaveLength(2);

    expect(oldSocket.close).not.toHaveBeenCalled();

    deliver(sockets[1]!, sessionMessage('session_welcome', 'new'));

    expect(jest.mocked(oldSocket.close).mock.calls).toEqual([
      [1000, 'Reconnected to a new EventSub session'],
    ]);

    expect(mockCreateEventSubscription).not.toHaveBeenCalled();

    mockDeleteEventSubscription.mockResolvedValue(undefined);
    await TwitchWsService.unsubscribeFromEvent('channel.poll.begin');

    expect(mockDeleteEventSubscription.mock.calls).toEqual([['poll-sub-id']]);
  });

  test('resubscribes on the welcome of a fresh connection', async () => {
    mockCreateEventSubscription.mockResolvedValue(
      createSubscriptionResponse('poll-sub-id', 'channel.poll.begin'),
    );

    await TwitchWsService.subscribeToEvent(
      'channel.poll.begin',
      '1',
      { broadcaster_user_id: 'channel-id' },
      jest.fn(),
    );

    mockCreateEventSubscription.mockClear();

    deliver(
      TwitchWsService.getInstance(),
      sessionMessage('session_welcome', 'fresh'),
    );

    expect(mockCreateEventSubscription).toHaveBeenCalledTimes(1);
  });

  test('logs the thrown error of an event callback', async () => {
    const error = new Error('callback failed');
    const mockError = jest.spyOn(logger.twitchWs, 'error');

    mockCreateEventSubscription.mockResolvedValue(
      createSubscriptionResponse('poll-sub-id', 'channel.poll.begin'),
    );

    await TwitchWsService.subscribeToEvent(
      'channel.poll.begin',
      '1',
      { broadcaster_user_id: 'channel-id' },
      () => {
        throw error;
      },
    );

    deliver(
      TwitchWsService.getInstance(),
      createNotification('channel.poll.begin', {
        broadcaster_user_id: 'channel-id',
      }),
    );

    expect(mockError.mock.calls).toEqual([['💜 error in event CB', error]]);
  });
});
