import { RefObject } from 'react';

import { attachSharedListeners } from './attachedSharedListeners';
import { attachListeners } from './attachListener';
import { ReadyState } from './constants';
import {
  addSubscriber,
  hasSubscribers,
  removeSubscriber,
} from './manage-subscribers';
import {
  Options,
  sharedWebSockets,
  type Subscriber,
  type WebSocketEventMap,
} from './types';

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
      sharedWebSockets[url] = new WebSocket(url, optionsRef.current?.protocols);
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
    } satisfies Subscriber;

    addSubscriber(url, subscriber);
    webSocketRef.current = sharedWebSockets[url];

    return () => {
      removeSubscriber(url, subscriber);
      if (!hasSubscribers(url)) {
        const socket = sharedWebSockets[url];
        if (socket) {
          socket.onclose = () => {};
          socket.close();
        }
        // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
        delete sharedWebSockets[url];
      }
    };
  }
  setReadyState(ReadyState.CONNECTING);
  webSocketRef.current = new WebSocket(url, optionsRef.current?.protocols);

  return attachListeners(
    webSocketRef.current,
    {
      setLastMessage,
      setReadyState,
    },
    optionsRef,
    startRef.current ?? (() => {}),
    reconnectCount,
  );
};
