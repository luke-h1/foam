import { Platform } from 'react-native';
import { ReadyState } from './constants';
import type { WebSocketMessage } from './types';

type NitroReadyState = 'CONNECTING' | 'OPEN' | 'CLOSING' | 'CLOSED';

interface NitroMessageEvent {
  data: string;
  isBinary: boolean;
  binaryData?: ArrayBuffer;
}

interface NitroCloseEvent {
  code: number;
  reason: string;
  wasClean?: boolean;
}

interface NitroWebSocket {
  readonly bufferedAmount: number;
  readonly extensions: string;
  readonly protocol: string;
  readonly readyState: NitroReadyState;
  readonly url: string;
  onclose: ((event: NitroCloseEvent) => void) | null;
  onerror: ((error: string) => void) | null;
  onmessage: ((event: NitroMessageEvent) => void) | null;
  onopen: (() => void) | null;
  close(code?: number, reason?: string): void;
  send(data: string | ArrayBuffer): void;
}

interface NitroWebSocketConstructor {
  new (
    url: string,
    protocols?: string | string[],
    headers?: Record<string, string>,
  ): NitroWebSocket;
}

interface NitroWebSocketModule {
  NitroWebSocket: NitroWebSocketConstructor;
  prewarmOnAppStart: (
    url: string,
    protocols?: string[],
    headers?: Record<string, string>,
  ) => void;
}

interface PlatformWebSocketConstructor {
  new (
    url: string,
    protocols?: string | string[],
    options?: { headers?: Record<string, string> },
  ): WebSocket;
}

function getNitroWebSocketModule(): NitroWebSocketModule | null {
  if (Platform.OS === 'web') {
    return null;
  }

  try {
    return require('react-native-nitro-websockets') as NitroWebSocketModule;
  } catch {
    return null;
  }
}

function normalizeProtocols(
  protocols?: string | string[],
): string[] | undefined {
  if (protocols === undefined) {
    return undefined;
  }
  return Array.isArray(protocols) ? protocols : [protocols];
}

function getNitroReadyState(readyState: NitroReadyState): ReadyState {
  switch (readyState) {
    case 'CONNECTING':
      return ReadyState.CONNECTING;
    case 'OPEN':
      return ReadyState.OPEN;
    case 'CLOSING':
      return ReadyState.CLOSING;
    case 'CLOSED':
      return ReadyState.CLOSED;
  }
}

function createCloseEvent(event: NitroCloseEvent): CloseEvent {
  return {
    code: event.code,
    reason: event.reason,
    type: 'close',
    wasClean: event.wasClean ?? event.code === 1000,
  } as CloseEvent;
}

function createErrorEvent(error: string): Event {
  return {
    message: error,
    type: 'error',
  } as unknown as Event;
}

function createMessageEvent(event: NitroMessageEvent): MessageEvent {
  return {
    data: event.isBinary ? event.binaryData : event.data,
    type: 'message',
  } as MessageEvent;
}

function toArrayBuffer(view: ArrayBufferView): ArrayBuffer {
  return new Uint8Array(view.buffer, view.byteOffset, view.byteLength).slice()
    .buffer;
}

class NitroWebSocketAdapter {
  onclose: ((event: CloseEvent) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;
  onopen: (() => void) | null = null;

  constructor(private socket: NitroWebSocket) {
    this.socket.onopen = () => {
      this.onopen?.();
    };
    this.socket.onmessage = event => {
      this.onmessage?.(createMessageEvent(event));
    };
    this.socket.onclose = event => {
      this.onclose?.(createCloseEvent(event));
    };
    this.socket.onerror = error => {
      this.onerror?.(createErrorEvent(error));
    };
  }

  get bufferedAmount() {
    return this.socket.bufferedAmount;
  }

  get extensions() {
    return this.socket.extensions;
  }

  get protocol() {
    return this.socket.protocol;
  }

  get readyState() {
    return getNitroReadyState(this.socket.readyState);
  }

  get url() {
    return this.socket.url;
  }

  close(code?: number, reason?: string) {
    this.socket.close(code, reason);
  }

  send(data: WebSocketMessage) {
    if (typeof data === 'string' || data instanceof ArrayBuffer) {
      this.socket.send(data);
      return;
    }

    if (ArrayBuffer.isView(data)) {
      this.socket.send(toArrayBuffer(data));
      return;
    }

    throw new TypeError('Nitro WebSocket does not support Blob payloads');
  }
}

function createPlatformWebSocket(
  url: string,
  protocols?: string | string[],
  headers?: Record<string, string>,
): WebSocket {
  const WebSocketConstructor =
    globalThis.WebSocket as PlatformWebSocketConstructor;
  if (
    Platform.OS !== 'web' &&
    headers !== undefined &&
    Object.keys(headers).length > 0
  ) {
    return new WebSocketConstructor(url, protocols, { headers });
  }

  return new WebSocketConstructor(url, protocols);
}

export function createWebSocket(
  url: string,
  protocols?: string | string[],
  headers?: Record<string, string>,
): WebSocket {
  const nitroModule = getNitroWebSocketModule();
  if (nitroModule !== null) {
    try {
      return new NitroWebSocketAdapter(
        new nitroModule.NitroWebSocket(url, protocols, headers),
      ) as unknown as WebSocket;
    } catch {
      return createPlatformWebSocket(url, protocols, headers);
    }
  }

  return createPlatformWebSocket(url, protocols, headers);
}

export function prewarmWebSocketOnAppStart(
  url: string,
  protocols?: string | string[],
  headers?: Record<string, string>,
) {
  const nitroModule = getNitroWebSocketModule();
  if (nitroModule === null) {
    return;
  }

  try {
    const normalizedProtocols = normalizeProtocols(protocols);
    if (headers !== undefined) {
      nitroModule.prewarmOnAppStart(url, normalizedProtocols, headers);
    } else if (normalizedProtocols !== undefined) {
      nitroModule.prewarmOnAppStart(url, normalizedProtocols);
    } else {
      nitroModule.prewarmOnAppStart(url);
    }
  } catch {
    // Prewarm is an optimization; socket creation still falls back normally.
  }
}
