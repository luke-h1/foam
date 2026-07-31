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

export type TwitchWsTestState = {
  /**
   * Private on the service; reached for so a test can arm the backoff reconnect
   * without faking a keepalive lapse over the wire.
   */
  attemptReconnect: () => void;
  activeSubscriptions: Map<string, string>;
  eventCallbacks: Map<string, EventCallback[]>;
  instance: TestSocket | null;
  isReconnecting: boolean;
  reconnectTimer: ReturnType<typeof setTimeout> | null;
  sessionId: string;
  subscriptionConfigs: Map<
    string,
    { condition: Record<string, string>; version: string }
  >;
};

export function getTwitchWsTestState(): TwitchWsTestState {
  // @ts-expect-error test access to TwitchWsService private static state
  return TwitchWsService;
}

export function resetTwitchWsTestState(state: TwitchWsTestState) {
  state.activeSubscriptions = new Map();
  state.eventCallbacks = new Map();
  state.instance = null;
  state.isReconnecting = false;
  state.reconnectTimer = null;
  state.sessionId = 'session-id';
  state.subscriptionConfigs = new Map();
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
