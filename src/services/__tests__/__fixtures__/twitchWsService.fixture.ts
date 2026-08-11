import TwitchWsService from '@app/services/twitch-ws-service';

type EventCallback = (data: unknown) => void;

/**
 * Only the surface the service touches on its socket, so tests can install a
 * fake without standing up a whole `WebSocket`.
 */
type TestSocket = {
  close: (code?: number, reason?: string) => void;
  readyState: number;
};

type TestEventSubEntry = {
  eventType: string;
  version: string;
  condition: Record<string, string>;
  callbacks: EventCallback[];
  subscriptionId: string | null;
};

export type TwitchWsTestState = {
  /**
   * Private on the service; reached for so a test can arm the backoff reconnect
   * without faking a keepalive lapse over the wire.
   */
  attemptReconnect: () => void;
  /**
   * Private on the service; reached for so routing tests can deliver a
   * notification without a socket.
   */
  handleNotification: (message: unknown) => void;
  entries: Map<string, TestEventSubEntry>;
  appStateSubscription: { remove: () => void } | null;
  instance: TestSocket | null;
  isReconnecting: boolean;
  reconnectTimer: ReturnType<typeof setTimeout> | null;
  sessionId: string;
};

export function getTwitchWsTestState(): TwitchWsTestState {
  // @ts-expect-error test access to TwitchWsService private static state
  return TwitchWsService;
}

export function resetTwitchWsTestState(state: TwitchWsTestState) {
  state.appStateSubscription?.remove();
  state.appStateSubscription = null;
  state.entries = new Map();
  state.instance = null;
  state.isReconnecting = false;
  state.reconnectTimer = null;
  state.sessionId = 'session-id';
}

/**
 * Stands in for the WebSocket the service opens, so tests can assert whether a
 * teardown actually closed the socket.
 */
export function createFakeSocket() {
  return {
    close: jest.fn(),
    readyState: 1,
  } satisfies TestSocket;
}
