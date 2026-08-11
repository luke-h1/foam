import { setSevenTvSessionId } from '@app/utils/seventv/sevenTvSessionId';
import {
  createSeventvSessionState,
  type SeventvSessionState,
} from '@app/utils/seventv/seventvSessionState';

jest.mock('@app/utils/seventv/sevenTvSessionId', () => ({
  setSevenTvSessionId: jest.fn(),
}));

const mockSetSevenTvSessionId = jest.mocked(setSevenTvSessionId);

interface SessionFieldSnapshot {
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
}

const snapshotFields = (state: SeventvSessionState): SessionFieldSnapshot => ({
  hasInitialized: state.hasInitialized,
  hasInitialSubscriptions: state.hasInitialSubscriptions,
  connectionTimestamp: state.connectionTimestamp,
  currentEmoteSetId: state.currentEmoteSetId,
  activeSubscriptions: state.activeSubscriptions,
  sessionId: state.sessionId,
  shouldResume: state.shouldResume,
  resumePending: state.resumePending,
  resumeFallbackTimer: state.resumeFallbackTimer,
  subscribedChannelId: state.subscribedChannelId,
  subscribedOwnerId: state.subscribedOwnerId,
  heartbeatIntervalMs: state.heartbeatIntervalMs,
  lastMessageAt: state.lastMessageAt,
  heartbeatWatchdog: state.heartbeatWatchdog,
});

const createState = () =>
  createSeventvSessionState({ defaultHeartbeatIntervalMs: 30_000 });

const populate = (state: SeventvSessionState) => {
  state.hasInitialized = true;
  state.hasInitialSubscriptions = true;
  state.connectionTimestamp = 1_000;
  state.currentEmoteSetId = 'set-a';
  state.activeSubscriptions.add('set-a');
  state.sessionId = 'session-a';
  state.shouldResume = true;
  state.resumePending = true;
  state.resumeFallbackTimer = setTimeout(() => {}, 60_000);
  state.subscribedChannelId = 'channel-a';
  state.subscribedOwnerId = 'owner-a';
  state.heartbeatIntervalMs = 45_000;
  state.lastMessageAt = 2_000;
  state.heartbeatWatchdog = setInterval(() => {}, 10_000);
};

describe('createSeventvSessionState', () => {
  test('starts with an empty session', () => {
    const state = createState();

    expect(snapshotFields(state)).toEqual<SessionFieldSnapshot>({
      hasInitialized: false,
      hasInitialSubscriptions: false,
      connectionTimestamp: null,
      currentEmoteSetId: undefined,
      activeSubscriptions: new Set(),
      sessionId: null,
      shouldResume: false,
      resumePending: false,
      resumeFallbackTimer: null,
      subscribedChannelId: null,
      subscribedOwnerId: null,
      heartbeatIntervalMs: 30_000,
      lastMessageAt: 0,
      heartbeatWatchdog: null,
    });
  });
});

describe('reset', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  test("reset('leave') drops the whole session including hasInitialized and the shared session id", () => {
    const state = createState();
    populate(state);

    state.reset('leave');

    expect(snapshotFields(state)).toEqual<SessionFieldSnapshot>({
      hasInitialized: false,
      hasInitialSubscriptions: false,
      connectionTimestamp: null,
      currentEmoteSetId: undefined,
      activeSubscriptions: new Set(),
      sessionId: null,
      shouldResume: false,
      resumePending: false,
      resumeFallbackTimer: null,
      subscribedChannelId: null,
      subscribedOwnerId: null,
      heartbeatIntervalMs: 45_000,
      lastMessageAt: 2_000,
      heartbeatWatchdog: null,
    });
    expect(mockSetSevenTvSessionId).toHaveBeenCalledTimes(1);
    expect(mockSetSevenTvSessionId).toHaveBeenCalledWith(null);
  });

  test("reset('unmount') drops the whole session but leaves hasInitialized alone", () => {
    const state = createState();
    populate(state);

    state.reset('unmount');

    expect(snapshotFields(state)).toEqual<SessionFieldSnapshot>({
      hasInitialized: true,
      hasInitialSubscriptions: false,
      connectionTimestamp: null,
      currentEmoteSetId: undefined,
      activeSubscriptions: new Set(),
      sessionId: null,
      shouldResume: false,
      resumePending: false,
      resumeFallbackTimer: null,
      subscribedChannelId: null,
      subscribedOwnerId: null,
      heartbeatIntervalMs: 45_000,
      lastMessageAt: 2_000,
      heartbeatWatchdog: null,
    });
    expect(mockSetSevenTvSessionId).toHaveBeenCalledTimes(1);
    expect(mockSetSevenTvSessionId).toHaveBeenCalledWith(null);
  });

  test("reset('close') keeps the resumable session and only drops connection-scoped state", () => {
    const state = createState();
    populate(state);

    state.reset('close');

    expect(snapshotFields(state)).toEqual<SessionFieldSnapshot>({
      hasInitialized: true,
      hasInitialSubscriptions: false,
      connectionTimestamp: 1_000,
      currentEmoteSetId: 'set-a',
      activeSubscriptions: new Set(['set-a']),
      sessionId: 'session-a',
      shouldResume: true,
      resumePending: false,
      resumeFallbackTimer: null,
      subscribedChannelId: null,
      subscribedOwnerId: null,
      heartbeatIntervalMs: 45_000,
      lastMessageAt: 2_000,
      heartbeatWatchdog: null,
    });
    expect(mockSetSevenTvSessionId).not.toHaveBeenCalled();
  });

  test.each(['leave', 'unmount', 'close'] as const)(
    "reset('%s') re-arms the connect-time subscribe",
    reason => {
      const state = createState();
      populate(state);

      state.reset(reason);

      // useSeventvWs gates runInitialSubscriptions on this being false, so a
      // reason that left it set would reconnect into a session that never
      // subscribes and silently stops receiving 7TV emote updates.
      expect(state.hasInitialSubscriptions).toBe(false);
    },
  );

  test('reset cancels the pending resume fallback and heartbeat watchdog', () => {
    const state = createState();
    const onResumeFallback = jest.fn();
    const onWatchdogTick = jest.fn();
    state.resumeFallbackTimer = setTimeout(() => onResumeFallback(), 5_000);
    state.heartbeatWatchdog = setInterval(() => onWatchdogTick(), 10_000);

    state.reset('close');
    jest.advanceTimersByTime(60_000);

    expect(onResumeFallback).not.toHaveBeenCalled();
    expect(onWatchdogTick).not.toHaveBeenCalled();
  });
});

describe('subscription run fencing', () => {
  test('a run stays current until a reset bumps the generation', () => {
    const state = createState();
    const stillCurrent = state.beginSubscriptionRun();

    expect(stillCurrent()).toBe(true);

    state.reset('close');

    expect(stillCurrent()).toBe(false);
  });

  test('every reset reason fences out an in-flight run', () => {
    (['leave', 'unmount', 'close'] as const).forEach(reason => {
      const state = createState();
      const stillCurrent = state.beginSubscriptionRun();

      state.reset(reason);

      expect(stillCurrent()).toBe(false);
    });
  });

  test('a hop between two known channels fences out an in-flight run', () => {
    const state = createState();
    state.noteChannelId('channel-a');
    const stillCurrent = state.beginSubscriptionRun();

    state.noteChannelId('channel-b');

    expect(stillCurrent()).toBe(false);
  });

  test('the first known channel id does not fence a run waiting for it', () => {
    const state = createState();
    const stillCurrent = state.beginSubscriptionRun();

    state.noteChannelId(undefined);
    state.noteChannelId('channel-a');
    state.noteChannelId('channel-a');

    expect(stillCurrent()).toBe(true);
  });

  test('an undefined gap between two different channels still fences', () => {
    const state = createState();
    state.noteChannelId('channel-a');
    const stillCurrent = state.beginSubscriptionRun();

    state.noteChannelId(undefined);
    state.noteChannelId('channel-b');

    expect(stillCurrent()).toBe(false);
  });

  test("reset('leave') forgets the noted channel so the next session's first channel does not fence", () => {
    const state = createState();
    state.noteChannelId('channel-a');
    state.reset('leave');

    const stillCurrent = state.beginSubscriptionRun();
    state.noteChannelId('channel-b');

    expect(stillCurrent()).toBe(true);
  });
});
