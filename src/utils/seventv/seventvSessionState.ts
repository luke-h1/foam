import { setSevenTvSessionId } from '@app/utils/seventv/sevenTvSessionId';

export type SeventvSessionResetReason = 'leave' | 'unmount' | 'close';

export interface CreateSeventvSessionStateOptions {
  /**
   * Heartbeat interval used until the server's HELLO frame supplies its own.
   */
  defaultHeartbeatIntervalMs: number;
}

/**
 * Hook-private session state for the 7TV EventAPI socket; `reset(reason)` is
 * the one place that encodes what each teardown path drops.
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
   * Returns a `stillCurrent` check; a generation bump (reset or channel hop)
   * turns it false so a stale poll loop stops before subscribing the old channel.
   */
  beginSubscriptionRun(): () => boolean;
  /**
   * A hop between two known channels bumps the subscription generation; the
   * initial undefined -> defined transition does not, since the poll loop waits for it.
   */
  noteChannelId(channelId: string | undefined): void;
  /**
   * One owner for all teardown paths: `'close'` keeps the session id so the
   * next connect can RESUME; `'leave'`/`'unmount'` drop the whole session.
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
