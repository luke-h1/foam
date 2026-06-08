import type { RefObject } from 'react';
import { createRef } from '@app/testing/createRef';
import { ReadyState } from '../constants';
import { createOrJoinSocket } from '../createOrJoin';
import type { Options } from '../types';

const mockNitroWebSocketInstances: MockNitroWebSocket[] = [];

class MockNitroWebSocket {
  bufferedAmount = 0;
  extensions = '';
  onclose: ((event: { code: number; reason: string }) => void) | null = null;
  onerror: ((error: string) => void) | null = null;
  onmessage:
    | ((event: {
        data: string;
        isBinary: boolean;
        binaryData?: ArrayBuffer;
      }) => void)
    | null = null;
  onopen: (() => void) | null = null;
  protocol = '';
  readyState: 'CONNECTING' | 'OPEN' | 'CLOSING' | 'CLOSED' = 'CONNECTING';
  sent: (string | ArrayBuffer)[] = [];

  constructor(
    public url: string,
    public protocols?: string | string[],
    public headers?: Record<string, string>,
  ) {
    mockNitroWebSocketInstances.push(this);
  }

  close(code = 1000, reason = '') {
    this.readyState = 'CLOSED';
    this.onclose?.({ code, reason });
  }

  send(data: string | ArrayBuffer) {
    this.sent.push(data);
  }
}

const mockNitroWebSocket = jest.fn(
  (
    url: string,
    protocols?: string | string[],
    headers?: Record<string, string>,
  ) => new MockNitroWebSocket(url, protocols, headers),
);

jest.mock(
  'react-native-nitro-websockets',
  () => ({
    NitroWebSocket: mockNitroWebSocket,
  }),
  { virtual: true },
);

describe('createOrJoinSocket', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockNitroWebSocketInstances.length = 0;
  });

  test('uses Nitro WebSocket on native and adapts readyState to the hook contract', () => {
    const webSocketRef: RefObject<WebSocket | null> = { current: null };
    const setReadyState = jest.fn();
    const setLastMessage = jest.fn();
    const startRef = createRef(jest.fn());
    const reconnectCount = createRef(0);
    const optionsRef = createRef<Options>({
      protocols: ['irc'],
      options: {
        headers: {
          Authorization: 'Bearer token',
        },
      },
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

    expect(mockNitroWebSocket.mock.calls).toEqual([
      [
        'wss://irc-ws.chat.twitch.tv:443',
        ['irc'],
        {
          Authorization: 'Bearer token',
        },
      ],
    ]);
    expect(webSocketRef.current?.readyState).toBe(ReadyState.CONNECTING);

    const nitroSocket = mockNitroWebSocketInstances[0];
    if (nitroSocket === undefined) {
      throw new Error('Expected Nitro WebSocket instance to be created');
    }
    nitroSocket.readyState = 'OPEN';
    nitroSocket.onopen?.();

    expect(setReadyState.mock.calls).toEqual([
      [ReadyState.CONNECTING],
      [ReadyState.OPEN],
    ]);
    expect(webSocketRef.current?.readyState).toBe(ReadyState.OPEN);
  });
});
