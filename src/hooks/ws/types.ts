import type { RefObject } from 'react';

import { ReadyState } from './constants';

export interface QueryParams {
  [key: string]: string | number;
}

export interface Options {
  fromSocketIO?: boolean;
  queryParams?: QueryParams;
  protocols?: string | string[];
  options?: {
    headers: {
      [headerName: string]: string;
    };
  } | null;
  share?: boolean;
  onOpen?: () => void;
  onClose?: (event: WebSocketEventMap['close']) => void;
  onMessage?: (event: WebSocketEventMap['message']) => void;
  onError?: (event: WebSocketEventMap['error']) => void;
  onReconnectStop?: (numAttempts: number) => void;
  shouldReconnect?: (event: WebSocketEventMap['close']) => boolean;
  reconnectInterval?: number;
  reconnectAttempts?: number;
  filter?: (message: WebSocketEventMap['message']) => boolean;
  retryOnError?: boolean;
  /**
   * Mirror incoming messages into `lastMessage` state. Off by default: at chat rates the per-message setState re-rendered the host dozens of times a second.
   */
  trackLastMessage?: boolean;
}

export type ReadyStateState = {
  [url: string]: ReadyState;
};

export type WebSocketMessage = string | ArrayBuffer | Blob | ArrayBufferView;

export type SendMessage = (message: WebSocketMessage) => void;
export type SendJsonMessage<TJsonMessage = never> = (
  jsonMessage: TJsonMessage,
) => void;

export type Subscriber<T = WebSocketEventMap['message']> = {
  setLastMessage: (message: T) => void;
  setReadyState: (readyState: ReadyState) => void;
  optionsRef: RefObject<Options>;
  reconnectCount: RefObject<number>;
  reconnect: RefObject<() => void>;
};

export type WebSocketHookReturn<
  T = WebSocketEventMap['message'],
  TJsonMessage = never,
> = {
  sendMessage: SendMessage;
  sendJsonMessage: SendJsonMessage<TJsonMessage>;
  lastMessage: T;
  lastJsonMessage: unknown;
  readyState: ReadyState;
  getWebSocket: () => WebSocket;
  reconnect: () => void;
};

type WebSocketCloseEvent = CloseEvent;
type WebSocketErrorEvent = Event;
type WebSocketMessageEvent = MessageEvent;

export type WebSocketEventMap = {
  close: WebSocketCloseEvent;
  error: WebSocketErrorEvent;
  message: WebSocketMessageEvent;
};

export interface SharedWebSockets {
  [url: string]: WebSocket;
}

export const sharedWebSockets: SharedWebSockets = {};
