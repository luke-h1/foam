const MILLISECONDS = 1;
const SECONDS = 1000 * MILLISECONDS;

export const SOCKET_IO_PING_INTERVAL = 25 * SECONDS;
export const SOCKET_IO_PATH = '/socket.io/?EIO=3&transport=websocket';
export const SOCKET_IO_PING_CODE = '2';
export const DEFAULT_RECONNECT_LIMIT = 20;
export const DEFAULT_RECONNECT_INTERVAL_MS = 5000;

export const setupSocketPing = (instance: WebSocket) => {
  const ping = () => instance.send(SOCKET_IO_PING_CODE);
  return setInterval(ping, SOCKET_IO_PING_INTERVAL);
};

export enum ReadyState {
  UNINSTANTIATED = -1,
  CONNECTING = 0,
  OPEN = 1,
  CLOSING = 2,
  CLOSED = 3,
}
