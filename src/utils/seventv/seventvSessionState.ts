import { setSevenTvSessionId } from '@app/utils/seventv/sevenTvSessionId';

export type SeventvSessionResetReason = 'leave' | 'unmount' | 'close';

export interface CreateSeventvSessionStateOptions {
  /**
   * Heartbeat interval used until the server's HELLO frame supplies its own.
   */
  defaultHeartbeatIntervalMs: number;
}

/**
 * The 7TV EventAPI hook's private session state: every field the socket
 * lifecycle reads or resets lives here so `reset(reason)` is the one place
 * that encodes what each teardown path drops. This is hook-private state, not
 * store state - `useSeventvWs` holds a single ref to one instance.
 */
export interface SeventvSessionState {
  hasInitialized: boolean;
  hasInitialSubscriptions: boolean;
  connectionTimestamp: number | null;
  currentEmoteSetId: string | undefined;
  activeSubscriptions: Set<string>;
  sessionId: string | null;
  shouldResume: boolean;
  resumePending: boolean;
  resumeFallbackTimer: ReturnType<typeof setTimeout> | null;
  subscribedChannelId: string | null;
  subscribedOwnerId: string | null;
  heartbeatIntervalMs: number;
  lastMessageAt: number;
  heartbeatWatchdog: ReturnType<typeof setInterval> | null;
  clearResumeFallbackTimer(): void;
  stopHeartbeatWatchdog(): void;
  /**
   * Fences one initial-subscription run: captures the current subscription
   * generation and returns a `stillCurrent` check. A generation bump (any
   * `reset`, or a channel hop via `noteChannelId`) turns the check false, so
   * a stale poll loop must stop before subscribing the old channel.
   */
  beginSubscriptionRun(): () => boolean;
  /**
   * Records the channel id the hook is currently serving. A hop between two
   * different known channels bumps the subscription generation; the initial
   * undefined -> defined transition does not, because the poll loop is
   * allowed to wait for exactly that.
   */
  noteChannelId(channelId: string | undefined): void;
  /**
   * One owner for the three teardown paths. All reasons bump the subscription
   * generation, clear both timers, drop `resumePending`, the channel-scoped
   * subscription ids and `hasInitialSubscriptions` - the last of these gates
   * the connect-time subscribe, so a reason that left it set would reconnect
   * into a session that never subscribes. After `'close'` the session id and
   * resume intent survive so the next connect can RESUME instead, which
   * restores the subscriptions server-side. `'leave'` and `'unmount'` drop the whole
   * session (connection timestamp, emote-set bookkeeping, session id, resume
   * flags) and clear the shared session id; `'leave'` also re-arms
   * `hasInitialized` for the next screen entry, which `'unmount'` leaves
   * as-is.
   */
  reset(reason: SeventvSessionResetReason): void;
}

export const createSeventvSessionState = (
  options: CreateSeventvSessionStateOptions,
): SeventvSessionState => {
  let subscriptionGeneration = 0;
  let lastNotedChannelId: string | undefined;

  const state: SeventvSessionState = {
    hasInitialized: false,
    hasInitialSubscriptions: false,
    connectionTimestamp: null,
    currentEmoteSetId: undefined,
    activeSubscriptions: new Set<string>(),
    sessionId: null,
    shouldResume: false,
    resumePending: false,
    resumeFallbackTimer: null,
    subscribedChannelId: null,
    subscribedOwnerId: null,
    heartbeatIntervalMs: options.defaultHeartbeatIntervalMs,
    lastMessageAt: 0,
    heartbeatWatchdog: null,
    clearResumeFallbackTimer() {
      if (state.resumeFallbackTimer) {
        clearTimeout(state.resumeFallbackTimer);
        state.resumeFallbackTimer = null;
      }
    },
    stopHeartbeatWatchdog() {
      if (state.heartbeatWatchdog) {
        clearInterval(state.heartbeatWatchdog);
        state.heartbeatWatchdog = null;
      }
    },
    beginSubscriptionRun() {
      const runGeneration = subscriptionGeneration;
      return () => subscriptionGeneration === runGeneration;
    },
    noteChannelId(channelId) {
      if (channelId && lastNotedChannelId && channelId !== lastNotedChannelId) {
        subscriptionGeneration += 1;
      }
      if (channelId) {
        lastNotedChannelId = channelId;
      }
    },
    reset(reason) {
      subscriptionGeneration += 1;
      state.clearResumeFallbackTimer();
      state.stopHeartbeatWatchdog();
      state.resumePending = false;
      state.subscribedChannelId = null;
      state.subscribedOwnerId = null;
      state.hasInitialSubscriptions = false;
      if (reason === 'close') {
        return;
      }
      if (reason === 'leave') {
        state.hasInitialized = false;
      }
      lastNotedChannelId = undefined;
      state.connectionTimestamp = null;
      state.activeSubscriptions.clear();
      state.currentEmoteSetId = undefined;
      state.sessionId = null;
      state.shouldResume = false;
      setSevenTvSessionId(null);
    },
  };

  return state;
};
