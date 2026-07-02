import type { RefObject } from 'react';

import { createRef } from '@app/test/createRef';

import { ReadyState } from '../constants';
import { createOrJoinSocket } from '../createOrJoin';
import type { Options } from '../types';

const originalWebSocket = global.WebSocket;
const mockWebSocketInstances: MockWebSocket[] = [];

class MockWebSocket {
  static CONNECTING = ReadyState.CONNECTING;
  static OPEN = ReadyState.OPEN;
  static CLOSING = ReadyState.CLOSING;
  static CLOSED = ReadyState.CLOSED;

  bufferedAmount = 0;
  extensions = '';
  onclose: ((event: CloseEvent) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;
  onopen: (() => void) | null = null;
  protocol = '';
  readyState = ReadyState.CONNECTING;
  sent: string[] = [];

  constructor(
    public url: string,
    public protocols?: string | string[],
  ) {
    mockWebSocketInstances.push(this);
  }

  close(code = 1000, reason = '') {
    this.readyState = ReadyState.CLOSED;
    this.onclose?.({ code, reason, wasClean: code === 1000 } as CloseEvent);
  }

  send(data: string) {
    this.sent.push(data);
  }
}

describe('createOrJoinSocket', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockWebSocketInstances.length = 0;
    global.WebSocket = MockWebSocket as unknown as typeof WebSocket;
  });

  afterAll(() => {
    global.WebSocket = originalWebSocket;
  });

  test('uses the platform WebSocket and adapts readyState to the hook contract', () => {
    const webSocketRef: RefObject<WebSocket | null> = { current: null };
    const setReadyState = jest.fn();
    const setLastMessage = jest.fn();
    const startRef = createRef(jest.fn());
    const reconnectCount = createRef(0);
    const optionsRef = createRef<Options>({
      protocols: ['irc'],
    });

    createOrJoinSocket(
      webSocketRef,
      'wss://irc-ws.chat.twitch.tv:443',
      setReadyState,
      optionsRef,
      setLastMessage,
      startRef,
      reconnectCount,
    );

    const socket = mockWebSocketInstances[0];
    if (socket === undefined) {
      throw new Error('Expected WebSocket instance to be created');
    }

    expect({
      protocols: socket.protocols,
      readyState: webSocketRef.current?.readyState,
      url: socket.url,
    }).toEqual({
      protocols: ['irc'],
      readyState: ReadyState.CONNECTING,
      url: 'wss://irc-ws.chat.twitch.tv:443',
    });

    socket.readyState = ReadyState.OPEN;
    socket.onopen?.();

    expect(setReadyState.mock.calls).toEqual([
      [ReadyState.CONNECTING],
      [ReadyState.OPEN],
    ]);
    expect(webSocketRef.current?.readyState).toBe(ReadyState.OPEN);
  });
});
