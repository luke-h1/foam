import type { ReadyState } from './constants';

export interface Options {
  onOpen?: () => void;
  onClose?: (event: WebSocketEventMap['close']) => void;
  onMessage?: (event: WebSocketEventMap['message']) => void;
  onError?: (event: WebSocketEventMap['error']) => void;
  shouldReconnect?: (event: WebSocketEventMap['close']) => boolean;
  reconnectInterval?: number;
  reconnectAttempts?: number;
}

export type SendMessage = (
  message: string | ArrayBuffer | Blob | ArrayBufferView,
) => void;
export type SendJsonMessage<TJsonMessage = never> = (
  jsonMessage: TJsonMessage,
) => void;

export type WebSocketHookReturn<TJsonMessage = never> = {
  sendMessage: SendMessage;
  sendJsonMessage: SendJsonMessage<TJsonMessage>;
  readyState: ReadyState;
  getWebSocket: () => WebSocket;
  reconnect: () => void;
};

export type WebSocketEventMap = {
  close: CloseEvent;
  error: Event;
  message: MessageEvent;
};
