import { RefObject } from 'react';
import { attachListeners } from './attachListener';
import { attachSharedListeners } from './attachedSharedListeners';
import { ReadyState } from './constants';
import {
  addSubscriber,
  removeSubscriber,
  hasSubscribers,
} from './manage-subscribers';
import { Options, sharedWebSockets, type WebSocketEventMap } from './types';
import { createWebSocket } from './webSocketTransport';

export const createOrJoinSocket = (
  webSocketRef: RefObject<WebSocket | null>,
  url: string,
  setReadyState: (readyState: ReadyState) => void,
  optionsRef: RefObject<Options>,
  setLastMessage: (message: WebSocketEventMap['message']) => void,
  startRef: RefObject<() => void>,
  reconnectCount: RefObject<number>,
): (() => void) => {
  if (optionsRef.current?.share) {
    if (sharedWebSockets[url] === undefined) {
      setReadyState(ReadyState.CONNECTING);
      sharedWebSockets[url] = createWebSocket(
        url,
        optionsRef.current?.protocols,
        optionsRef.current?.options?.headers,
      );
      attachSharedListeners(sharedWebSockets[url], url);
    } else {
      setReadyState(sharedWebSockets[url].readyState);
    }

    const subscriber = {
      setLastMessage,
      setReadyState,
      optionsRef,
      reconnectCount,
      reconnect: startRef,
    };

    addSubscriber(url, subscriber);
    webSocketRef.current = sharedWebSockets[url];

    return () => {
      removeSubscriber(url, subscriber);
      if (!hasSubscribers(url)) {
        try {
          if (sharedWebSockets[url]) {
            sharedWebSockets[url].onclose = () => {};
            sharedWebSockets[url].close();
          }
        } catch {
          // Ignore error
        }
        // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
        delete sharedWebSockets[url];
      }
    };
  }
  setReadyState(ReadyState.CONNECTING);
  const webSocket = createWebSocket(
    url,
    optionsRef.current?.protocols,
    optionsRef.current?.options?.headers,
  );
  webSocketRef.current = webSocket;

  return attachListeners(
    webSocket,
    {
      setLastMessage,
      setReadyState,
    },
    optionsRef,
    startRef.current ?? (() => {}),
    reconnectCount,
  );
};
