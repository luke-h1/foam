import {
  getSevenTvSessionId,
  setSevenTvSessionId,
} from '@app/utils/seven-tv/sevenTvSessionId';

type SevenTvSessionResetReason = 'leave' | 'unmount' | 'close';

export interface CreateSevenTvSessionStateOptions {
  /**
   * Heartbeat interval used until the server's HELLO frame supplies its own.
   */
  defaultHeartbeatIntervalMs: number;
}

/**
 * Hook-private session state for the 7TV EventAPI socket; `reset(reason)` is
 * the one place that encodes what each teardown path drops.
 */
export interface SevenTvSessionState {
  hasInitialSubscriptions: boolean;
  connectionTimestamp: number | null;
  currentEmoteSetId: string | undefined;
  activeSubscriptions: Set<string>;
  /**
   * Reads and writes the module store in `sevenTvSessionId.ts`, which the
   * presence path also reads. That store is the only copy of the id.
   */
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
   * One owner for all teardown paths: `'close'` keeps the session id so the
   * next connect can RESUME; `'leave'`/`'unmount'` drop the whole session.
   */
  reset(reason: SevenTvSessionResetReason): void;
}

export const createSevenTvSessionState = (
  options: CreateSevenTvSessionStateOptions,
): SevenTvSessionState => {
  const state: SevenTvSessionState = {
    hasInitialSubscriptions: false,
    connectionTimestamp: null,
    currentEmoteSetId: undefined,
    activeSubscriptions: new Set<string>(),
    get sessionId() {
      return getSevenTvSessionId();
    },
    set sessionId(sessionId) {
      setSevenTvSessionId(sessionId);
    },
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
    reset(reason) {
      state.clearResumeFallbackTimer();
      state.stopHeartbeatWatchdog();
      state.resumePending = false;
      state.subscribedChannelId = null;
      state.subscribedOwnerId = null;
      state.hasInitialSubscriptions = false;

      if (reason === 'close') {
        return;
      }

      state.connectionTimestamp = null;
      state.activeSubscriptions.clear();
      state.currentEmoteSetId = undefined;
      state.sessionId = null;
      state.shouldResume = false;
    },
  };

  return state;
};
