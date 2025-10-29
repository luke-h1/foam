import type { RefObject } from 'react';

type IfEquals<X, Y, A = X, B = never> =
  (<T>() => T extends X ? 1 : 2) extends <T>() => T extends Y ? 1 : 2 ? A : B;

type WritableKeys<T> = {
  [P in keyof T]-?: IfEquals<
    { [Q in P]: T[P] },
    { -readonly [Q in P]: T[P] },
    P
  >;
}[keyof T];

export const websocketWrapper = (
  webSocket: WebSocket,
  start: RefObject<() => void>,
): WebSocket => {
  return new Proxy<WebSocket>(webSocket, {
    get: (obj, key: keyof WebSocket) => {
      const val = obj[key];
      if ((key as string) === 'reconnect') return start;
      if (typeof val === 'function') {
        console.error(
          'Calling methods directly on the websocket is not supported at this moment. You must use the methods returned by useWebSocket.',
        );

        // Prevent error thrown by invoking a non-function
        return () => {};
      }
      return val;
    },
    set: (obj: WebSocket, key: WritableKeys<WebSocket>, val: unknown) => {
      if (/^on/.test(key)) {
        console.warn(
          "The websocket's event handlers should be defined through the options object passed into useWebSocket.",
        );
        return false;
      }
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      // eslint-disable-next-line no-param-reassign
      obj[key] = val as WebSocket[keyof WebSocket];
      return true;
    },
  });
};
