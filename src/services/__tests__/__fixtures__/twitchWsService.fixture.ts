import TwitchWsService from '@app/services/twitch-ws-service';

type EventCallback = (data: unknown) => void;

export type TwitchWsTestState = {
  activeSubscriptions: Map<string, string>;
  eventCallbacks: Map<string, EventCallback[]>;
  instance: WebSocket | null;
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
  state.sessionId = 'session-id';
  state.subscriptionConfigs = new Map();
}
