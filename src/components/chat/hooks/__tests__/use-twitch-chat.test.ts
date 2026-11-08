import { act, renderHook } from '@testing-library/react-native';
import * as Network from 'expo-network';

import { ReadyState } from '@app/hooks/ws/constants';
import type { Options } from '@app/hooks/ws/types';
import * as UseWebsocketModule from '@app/hooks/ws/use-websocket';
import { preferences$ } from '@app/store/preference-store';
import { DefaultWrapper } from '@app/test/render';
import { silenceLogger } from '@app/test/silence-logger';
import * as AppStateTransitionsModule from '@app/utils/app-state/appStateTransitions';

import { useTwitchChat } from '../use-twitch-chat';

const mockedUseWebsocket = jest.spyOn(UseWebsocketModule, 'useWebsocket');

const mockedAddNetworkStateListener = jest
  .spyOn(Network, 'addNetworkStateListener')
  .mockReturnValue({ remove: jest.fn() });

const mockedGetNetworkStateAsync = jest
  .spyOn(Network, 'getNetworkStateAsync')
  .mockResolvedValue({ isConnected: true });

const mockedSubscribeToAppStateTransitions = jest
  .spyOn(AppStateTransitionsModule, 'subscribeToAppStateTransitions')
  .mockReturnValue(jest.fn());

silenceLogger();

const sendMessage = jest.fn();
const reconnect = jest.fn();
const close = jest.fn();

let socketReadyState: number;
let wsOptions: Options;

const noReconnect: Options = {
  reconnectPolicy: { baseIntervalMs: 0, maxAttempts: 0, jitterMs: 0 },
};

const socket: WebSocket = Object.create(WebSocket.prototype);

Object.defineProperty(socket, 'readyState', {
  get: () => socketReadyState,
});

Object.defineProperty(socket, 'close', { value: close });

function getForegroundTransitionListener() {
  const listener = mockedSubscribeToAppStateTransitions.mock.calls[0]?.[0];

  if (!listener) {
    throw new Error('useTwitchChat did not subscribe to app-state transitions');
  }

  return listener;
}

function renderConnectedChatHook() {
  const view = renderHook(() => useTwitchChat({ channel: 'foam' }), {
    wrapper: DefaultWrapper,
  });

  act(() => {
    wsOptions.onOpen?.();
  });

  sendMessage.mockClear();
  return view;
}

describe('useTwitchChat foreground liveness probe', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    socketReadyState = WebSocket.OPEN;
    wsOptions = noReconnect;

    mockedUseWebsocket.mockImplementation((_url, options) => {
      wsOptions = options;

      return {
        sendMessage,
        sendJsonMessage: jest.fn(),
        readyState: ReadyState.OPEN,
        getWebSocket: () => socket,
        reconnect,
      };
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('closes the socket for reconnect when the probe PING goes unanswered', () => {
    renderConnectedChatHook();

    act(() => {
      getForegroundTransitionListener()({
        previous: 'background',
        current: 'active',
      });
    });

    expect(sendMessage).toHaveBeenCalledWith('PING tmi.twitch.tv\r\n');

    expect(close).not.toHaveBeenCalled();

    act(() => {
      jest.advanceTimersByTime(5000);
    });

    expect(close).toHaveBeenCalledWith(4004, 'chat liveness probe timeout');

    expect(
      wsOptions.shouldReconnect?.(new CloseEvent('close', { code: 4004 })),
    ).toBe(true);
  });

  test('keeps the socket when an inbound line answers the probe in time', () => {
    renderConnectedChatHook();

    act(() => {
      getForegroundTransitionListener()({
        previous: 'inactive',
        current: 'active',
      });
    });

    expect(sendMessage).toHaveBeenCalledWith('PING tmi.twitch.tv\r\n');

    act(() => {
      wsOptions.onMessage?.(
        new MessageEvent('message', {
          data: ':tmi.twitch.tv PONG tmi.twitch.tv :tmi.twitch.tv\r\n',
        }),
      );
      jest.advanceTimersByTime(5000);
    });

    expect(close).not.toHaveBeenCalled();

    expect(reconnect).not.toHaveBeenCalled();
  });

  test('probes on the first connectivity regain after mounting offline', async () => {
    mockedGetNetworkStateAsync.mockResolvedValueOnce({ isConnected: false });
    renderConnectedChatHook();

    await act(async () => {
      await jest.advanceTimersByTimeAsync(0);
    });

    const networkListener =
      mockedAddNetworkStateListener.mock.calls.at(-1)?.[0];

    if (!networkListener) {
      throw new Error('useTwitchChat did not subscribe to network state');
    }

    act(() => {
      networkListener({ isConnected: true });
    });

    expect(sendMessage).toHaveBeenCalledWith('PING tmi.twitch.tv\r\n');
  });

  test('does not probe on a network event when connectivity never dropped', async () => {
    renderConnectedChatHook();

    await act(async () => {
      await jest.advanceTimersByTimeAsync(0);
    });

    const networkListener =
      mockedAddNetworkStateListener.mock.calls.at(-1)?.[0];

    if (!networkListener) {
      throw new Error('useTwitchChat did not subscribe to network state');
    }

    act(() => {
      networkListener({ isConnected: true });
    });

    expect(sendMessage).not.toHaveBeenCalled();
  });

  test('revives a non-open socket immediately on foreground instead of probing', () => {
    renderConnectedChatHook();
    socketReadyState = WebSocket.CLOSED;

    act(() => {
      getForegroundTransitionListener()({
        previous: 'background',
        current: 'active',
      });
    });

    expect(reconnect).toHaveBeenCalledTimes(1);

    expect(sendMessage).not.toHaveBeenCalled();
  });
});

describe('useTwitchChat join/part routing', () => {
  beforeEach(() => {
    socketReadyState = WebSocket.OPEN;
    wsOptions = noReconnect;
    preferences$.showJoinPartMessages.set(false);

    mockedUseWebsocket.mockImplementation((_url, options) => {
      wsOptions = options;

      return {
        sendMessage,
        sendJsonMessage: jest.fn(),
        readyState: ReadyState.OPEN,
        getWebSocket: () => socket,
        reconnect,
      };
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  function feedLine(line: string) {
    act(() => {
      wsOptions.onMessage?.(
        new MessageEvent('message', { data: `${line}\r\n` }),
      );
    });
  }

  test('routes another chatter’s JOIN and PART to the user handlers', () => {
    const onUserJoin = jest.fn();
    const onUserPart = jest.fn();
    const onJoin = jest.fn();
    const onPart = jest.fn();

    renderHook(
      () =>
        useTwitchChat({
          channel: 'foam',
          onUserJoin,
          onUserPart,
          onJoin,
          onPart,
        }),
      { wrapper: DefaultWrapper },
    );

    act(() => {
      wsOptions.onOpen?.();
    });

    feedLine(':bob!bob@bob.tmi.twitch.tv JOIN #foam');
    feedLine(':bob!bob@bob.tmi.twitch.tv PART #foam');

    expect(onUserJoin).toHaveBeenCalledWith('#foam', 'bob');

    expect(onUserPart).toHaveBeenCalledWith('#foam', 'bob');

    expect(onJoin).not.toHaveBeenCalled();

    expect(onPart).not.toHaveBeenCalled();
  });

  test('requests the membership capability only when join/part messages are enabled', () => {
    preferences$.showJoinPartMessages.set(true);
    renderHook(() => useTwitchChat({ channel: 'foam' }), {
      wrapper: DefaultWrapper,
    });

    act(() => {
      wsOptions.onOpen?.();
    });

    expect(sendMessage).toHaveBeenCalledWith(
      'CAP REQ :twitch.tv/tags twitch.tv/commands twitch.tv/membership\r\n',
    );
  });

  test('logs in anonymously when nobody is signed in, even with an app token', () => {
    renderHook(() => useTwitchChat({ channel: 'foam' }), {
      wrapper: DefaultWrapper,
    });

    act(() => {
      wsOptions.onOpen?.();
    });

    const loginLines = sendMessage.mock.calls
      .map(([line]) => String(line))
      .filter(line => line.startsWith('PASS') || line.startsWith('NICK'))
      .map(line => line.replace(/justinfan\d+/, 'justinfan'));

    expect(loginLines).toEqual(['PASS SCHMOOPIIE\r\n', 'NICK justinfan\r\n']);
  });

  test('omits the membership capability when the preference is off', () => {
    renderHook(() => useTwitchChat({ channel: 'foam' }), {
      wrapper: DefaultWrapper,
    });

    act(() => {
      wsOptions.onOpen?.();
    });

    expect(sendMessage).toHaveBeenCalledWith(
      'CAP REQ :twitch.tv/tags twitch.tv/commands\r\n',
    );
  });
});

describe('useTwitchChat join on welcome', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    socketReadyState = WebSocket.OPEN;
    wsOptions = noReconnect;
    preferences$.showJoinPartMessages.set(false);

    mockedUseWebsocket.mockImplementation((_url, options) => {
      wsOptions = options;

      return {
        sendMessage,
        sendJsonMessage: jest.fn(),
        readyState: ReadyState.OPEN,
        getWebSocket: () => socket,
        reconnect,
      };
    });
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  function sentJoins() {
    return sendMessage.mock.calls
      .map(([line]) => String(line))
      .filter(line => line.startsWith('JOIN'));
  }

  test('joins only after the 001 welcome, and only once', () => {
    renderHook(() => useTwitchChat({ channel: 'foam' }), {
      wrapper: DefaultWrapper,
    });

    act(() => {
      wsOptions.onOpen?.();
      jest.advanceTimersByTime(1000);
    });

    expect(sentJoins()).toEqual([]);

    act(() => {
      wsOptions.onMessage?.(
        new MessageEvent('message', {
          data: ':tmi.twitch.tv 001 justinfan :Welcome, GLHF!\r\n',
        }),
      );
      jest.advanceTimersByTime(1000);
    });

    expect(sentJoins()).toEqual(['JOIN #foam\r\n']);
  });

  test('reports a local part once when the server echoes the PART', () => {
    const onPart = jest.fn();

    const { result } = renderHook(
      () => useTwitchChat({ channel: 'foam', onPart }),
      { wrapper: DefaultWrapper },
    );

    act(() => {
      wsOptions.onOpen?.();
      wsOptions.onMessage?.(
        new MessageEvent('message', {
          data: ':tmi.twitch.tv 001 justinfan :Welcome, GLHF!\r\n:justinfan!justinfan@justinfan.tmi.twitch.tv JOIN #foam\r\n',
        }),
      );
    });

    act(() => {
      result.current.partChannel('foam');
      wsOptions.onMessage?.(
        new MessageEvent('message', {
          data: ':justinfan!justinfan@justinfan.tmi.twitch.tv PART #foam\r\n',
        }),
      );
    });

    expect(onPart.mock.calls).toEqual([['#foam']]);
  });
});
