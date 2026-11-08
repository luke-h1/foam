import { act, renderHook } from '@testing-library/react-native';

import { ReadyState } from '../constants';
import type { Options } from '../types';
import { useWebsocket } from '../use-websocket';

interface FakeSocketHandle {
  socket: WebSocket;
  close: jest.Mock;
  setReadyState: (state: number) => void;
}

const handles: FakeSocketHandle[] = [];

function createFakeSocket(): WebSocket {
  // SAFETY: built from WebSocket.prototype; the hook reads only the members defined here.
  const socket = Object.create(WebSocket.prototype) as WebSocket;
  let readyState: number = WebSocket.CONNECTING;
  const close = jest.fn();

  Object.defineProperty(socket, 'readyState', { get: () => readyState });
  Object.defineProperty(socket, 'close', { value: close });
  Object.defineProperty(socket, 'send', { value: jest.fn() });

  for (const handler of ['onopen', 'onclose', 'onmessage', 'onerror']) {
    Object.defineProperty(socket, handler, { value: null, writable: true });
  }

  handles.push({
    socket,
    close,
    setReadyState: state => {
      readyState = state;
    },
  });

  return socket;
}

const webSocketSpy = jest
  .spyOn(global, 'WebSocket')
  .mockImplementation(() => createFakeSocket());

afterAll(() => {
  webSocketSpy.mockRestore();
});

beforeEach(() => {
  handles.length = 0;
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

function getHandle(index: number): FakeSocketHandle {
  const handle = handles[index];

  if (!handle) {
    throw new Error(`useWebsocket did not open socket ${index}`);
  }

  return handle;
}

describe('useWebsocket', () => {
  test('a late close of a replaced CONNECTING socket does not touch the new connection', () => {
    const onClose = jest.fn();

    const options: Options = {
      onClose,
      shouldReconnect: () => true,
      reconnectPolicy: { baseIntervalMs: 1000, maxAttempts: 5, jitterMs: 0 },
    };

    const { result } = renderHook(() => useWebsocket('wss://example', options));
    const oldSocket = getHandle(0);

    act(() => {
      result.current.reconnect();
    });

    const newSocket = getHandle(1);

    act(() => {
      newSocket.setReadyState(WebSocket.OPEN);
      newSocket.socket.onopen?.(new Event('open'));
    });

    act(() => {
      oldSocket.setReadyState(WebSocket.CLOSED);
      oldSocket.socket.onclose?.(new CloseEvent('close', { code: 1006 }));
      jest.advanceTimersByTime(10_000);
    });

    expect(oldSocket.close).toHaveBeenCalledTimes(1);

    expect(onClose).not.toHaveBeenCalled();

    expect(result.current.readyState).toEqual(ReadyState.OPEN);

    expect(handles).toHaveLength(2);
  });
});
