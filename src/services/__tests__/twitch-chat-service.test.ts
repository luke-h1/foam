import { act, renderHook } from '@testing-library/react-native';
import * as Network from 'expo-network';

import { ReadyState } from '@app/hooks/ws/constants';
import type { Options } from '@app/hooks/ws/types';
import { useWebsocket } from '@app/hooks/ws/useWebsocket';
import { useTwitchChat } from '@app/services/twitch-chat-service';
import { subscribeToAppStateTransitions } from '@app/utils/appState/appStateTransitions';

jest.mock('@app/context/AuthContext', () => ({
  useAuthContext: () => ({ authState: undefined, user: undefined }),
}));

jest.mock('@app/services/api/clients', () => ({
  isE2EMode: false,
}));

jest.mock('@app/hooks/ws/useWebsocket', () => ({
  useWebsocket: jest.fn(),
}));

jest.mock('@app/utils/appState/appStateTransitions', () => ({
  subscribeToAppStateTransitions: jest.fn(() => jest.fn()),
}));

jest.mock('expo-network', () => ({
  addNetworkStateListener: jest.fn(() => ({ remove: jest.fn() })),
  getNetworkStateAsync: jest.fn(() => Promise.resolve({ isConnected: true })),
}));

jest.mock('@app/utils/logger', () => ({
  logger: {
    chat: {
      debug: jest.fn(),
      error: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
    },
  },
}));

const mockedUseWebsocket = jest.mocked(useWebsocket);
const mockedAddNetworkStateListener = jest.mocked(
  Network.addNetworkStateListener,
);
const mockedGetNetworkStateAsync = jest.mocked(Network.getNetworkStateAsync);
const mockedSubscribeToAppStateTransitions = jest.mocked(
  subscribeToAppStateTransitions,
);

const sendMessage = jest.fn();
const reconnect = jest.fn();
const close = jest.fn();

let socketReadyState: number;
let wsOptions: Options;

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
  const view = renderHook(() => useTwitchChat({ channel: 'foam' }));
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
    wsOptions = {};
    mockedUseWebsocket.mockImplementation((_url, options = {}) => {
      wsOptions = options;
      return {
        sendMessage,
        sendJsonMessage: jest.fn(),
        lastMessage: new MessageEvent('message'),
        lastJsonMessage: null,
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
      jest.advanceTimersByTime(5_000);
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
      jest.advanceTimersByTime(5_000);
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
