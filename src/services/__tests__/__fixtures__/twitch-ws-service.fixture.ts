import TwitchWsService from '@app/services/twitch-ws-service';

interface TestSocket {
  close: (code?: number, reason?: string) => void;
}

/**
 * The private static fields a test resets between cases. The service is a
 * singleton with no public reset, so state from one test reaches the next
 * without this.
 */
interface TwitchWsTestState {
  entries: Map<string, unknown>;
  awaitingReconnectWelcome: boolean;
  retiringInstance: TestSocket | null;
  appStateSubscription: { remove: () => void } | null;
  instance: TestSocket | null;
  isReconnecting: boolean;
  keepaliveTimer: ReturnType<typeof setTimeout> | null;
  reconnectAttempts: number;
  reconnectTimer: ReturnType<typeof setTimeout> | null;
  sessionId: string;
}

function getTwitchWsTestState(): TwitchWsTestState {
  // @ts-expect-error test access to TwitchWsService private static state
  return TwitchWsService;
}

export function resetTwitchWsTestState() {
  const state = getTwitchWsTestState();

  state.appStateSubscription?.remove();
  state.appStateSubscription = null;

  if (state.keepaliveTimer) {
    clearTimeout(state.keepaliveTimer);
  }

  if (state.reconnectTimer) {
    clearTimeout(state.reconnectTimer);
  }

  state.entries = new Map();
  state.awaitingReconnectWelcome = false;
  state.instance = null;
  state.retiringInstance = null;
  state.isReconnecting = false;
  state.keepaliveTimer = null;
  state.reconnectAttempts = 0;
  state.reconnectTimer = null;
  state.sessionId = 'session-id';
}

/**
 * Stands in for the WebSocket the service opens, so tests can assert whether a
 * teardown actually closed the socket.
 */
export function createFakeSocket(): WebSocket {
  // SAFETY: built from WebSocket.prototype; the service reads only the members set here.
  const base = Object.create(WebSocket.prototype) as WebSocket;

  return Object.assign(base, {
    close: jest.fn(),
    onclose: null,
    onmessage: null,
    readyState: 1,
  });
}
