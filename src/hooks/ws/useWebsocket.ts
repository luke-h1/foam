import { RefObject, useCallback, useEffect, useRef, useState } from 'react';

import { ReadyState } from './constants';
import { createOrJoinSocket } from './createOrJoin';
import { getUrl } from './get-url';
import { websocketWrapper } from './proxy';
import {
  Options,
  ReadyStateState,
  SendJsonMessage,
  SendMessage,
  sharedWebSockets,
  WebSocketHookReturn,
} from './types';

export const useWebsocket = (
  url: string | (() => string | Promise<string>) | null,
  options: Options = {},
  connect = true,
): WebSocketHookReturn => {
  const [lastMessage, setLastMessage] =
    useState<WebSocketEventMap['message']>();
  const [readyState, setReadyState] = useState<ReadyStateState>({});

  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const lastJsonMessage = null;

  const convertedUrl = useRef<string>('');
  const websocketRef = useRef<WebSocket | null>(null);
  const startRef = useRef<() => void>(() => {});
  const reconnectCount = useRef<number>(0);
  const webSocketProxy = useRef<WebSocket | null>(null);
  const optionsCache = useRef<Options>({});
  optionsCache.current = options;
  const connectRef = useRef(true);
  connectRef.current = connect;

  const readyStateSnapshotRef = useRef(readyState);
  readyStateSnapshotRef.current = readyState;

  const readyStateFromUrl: ReadyState =
    convertedUrl.current &&
    readyStateSnapshotRef.current[convertedUrl.current] !== undefined
      ? (readyStateSnapshotRef.current[convertedUrl.current] as ReadyState)
      : url !== null && connectRef.current
        ? ReadyState.CONNECTING
        : ReadyState.UNINSTANTIATED;

  const stringifiedQueryParams = options.queryParams
    ? JSON.stringify(options.queryParams)
    : null;

  /**
   * Non-OPEN sends are dropped: both consumers gate on readyState and
   * re-issue state on open/reconnect, so nothing needs queueing.
   */
  const sendMessage: SendMessage = useCallback(message => {
    if (
      websocketRef.current &&
      // eslint-disable-next-line @typescript-eslint/no-unsafe-enum-comparison
      websocketRef.current.readyState === ReadyState.OPEN
    ) {
      websocketRef.current.send(message);
    }
  }, []);

  const sendJsonMessage: SendJsonMessage = message => {
    sendMessage(JSON.stringify(message));
  };

  const getWebSocket = useCallback((): WebSocket => {
    /**
     * For non-shared connections, return the direct websocket if available
     */
    if (optionsCache.current?.share !== true && websocketRef.current !== null) {
      return websocketRef.current;
    }

    /**
     * For shared connections, use the proxy
     */
    if (
      webSocketProxy.current === null &&
      websocketRef.current &&
      startRef.current() !== undefined
    ) {
      webSocketProxy.current = websocketWrapper(websocketRef.current, startRef);
      return webSocketProxy.current;
    }

    if (webSocketProxy.current !== null) {
      return webSocketProxy.current;
    }

    /**
     * If we have a websocket ref, return it (even if proxy isn't set up yet)
     */
    if (websocketRef.current !== null) {
      return websocketRef.current;
    }

    /**
     * For shared connections, check the shared WebSockets map if the socket is already created.
     */
    if (optionsCache.current?.share && convertedUrl.current) {
      const sharedSocket = sharedWebSockets[convertedUrl.current];
      if (sharedSocket !== undefined) {
        return sharedSocket;
      }
    }

    /**
     * This is a dummy WebSocket object that is used to prevent null errors when the WebSocket is not initialized yet.
     */
    const dummySocket = Object.create(WebSocket.prototype) as WebSocket;
    Object.defineProperty(dummySocket, 'readyState', {
      value: WebSocket.CLOSED,
      writable: false,
      enumerable: true,
      configurable: false,
    });
    Object.defineProperty(dummySocket, 'url', {
      value: '',
      writable: false,
      enumerable: true,
      configurable: false,
    });
    return dummySocket;
  }, [optionsCache]);

  useEffect(() => {
    if (url !== null && connectRef.current === true) {
      let removeListeners: () => void;
      let expectClose = false;

      const start = async () => {
        convertedUrl.current = await getUrl(url, optionsCache);

        const protectedSetLastMessage = (
          message: WebSocketEventMap['message'],
        ) => {
          if (!expectClose) {
            setLastMessage(message);
          }
        };

        const protectedSetReadyState = (state: ReadyState) => {
          if (!expectClose) {
            setReadyState(prev => ({
              ...prev,
              [convertedUrl.current]: state,
            }));
          }
        };

        removeListeners = createOrJoinSocket(
          websocketRef as RefObject<WebSocket>,
          convertedUrl.current,
          protectedSetReadyState,
          optionsCache,
          protectedSetLastMessage,
          startRef,
          reconnectCount,
        );
      };
      startRef.current = () => {
        if (!expectClose) {
          if (webSocketProxy.current) {
            webSocketProxy.current = null;
          }
          removeListeners?.();
          void start();
        }
      };

      void start();
      const webSocketProxyRef = webSocketProxy;
      return () => {
        expectClose = true;
        if (webSocketProxyRef.current) {
          webSocketProxyRef.current = null;
        }
        removeListeners?.();
        setLastMessage(undefined);
      };
    }
    return undefined;
  }, [url, stringifiedQueryParams, optionsCache]);

  // Tear down the current socket (if any) and start a fresh connection.
  // Lets callers revive a connection whose automatic retries were exhausted,
  // e.g. when the app returns to the foreground after a long network outage.
  const reconnect = useCallback(() => {
    reconnectCount.current = 0;
    startRef.current();
  }, []);

  return {
    sendMessage,
    sendJsonMessage,
    lastMessage: lastMessage as WebSocketEventMap['message'],
    lastJsonMessage,
    readyState: readyStateFromUrl,
    getWebSocket,
    reconnect,
  };
};
