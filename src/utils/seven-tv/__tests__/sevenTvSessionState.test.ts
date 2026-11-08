import * as sevenTvSessionIdModule from '@app/utils/seven-tv/sevenTvSessionId';
import {
  createSevenTvSessionState,
  type SevenTvSessionState,
} from '@app/utils/seven-tv/sevenTvSessionState';

const mockSetSevenTvSessionId = jest.spyOn(
  sevenTvSessionIdModule,
  'setSevenTvSessionId',
);

interface SessionFieldSnapshot {
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

const snapshotFields = (state: SevenTvSessionState): SessionFieldSnapshot => ({
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
  createSevenTvSessionState({ defaultHeartbeatIntervalMs: 30_000 });

beforeEach(() => {
  sevenTvSessionIdModule.setSevenTvSessionId(null);
  mockSetSevenTvSessionId.mockClear();
});

const populate = (state: SevenTvSessionState) => {
  state.hasInitialSubscriptions = true;
  state.connectionTimestamp = 1000;
  state.currentEmoteSetId = 'set-a';
  state.activeSubscriptions.add('set-a');
  state.sessionId = 'session-a';
  state.shouldResume = true;
  state.resumePending = true;
  state.resumeFallbackTimer = setTimeout(() => {}, 60_000);
  state.subscribedChannelId = 'channel-a';
  state.subscribedOwnerId = 'owner-a';
  state.heartbeatIntervalMs = 45_000;
  state.lastMessageAt = 2000;
  state.heartbeatWatchdog = setInterval(() => {}, 10_000);
  mockSetSevenTvSessionId.mockClear();
};

describe('reset', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  test.each(['leave', 'unmount'] as const)(
    "reset('%s') drops the whole session and the shared session id",
    reason => {
      const state = createState();
      populate(state);

      state.reset(reason);

      expect(snapshotFields(state)).toEqual<SessionFieldSnapshot>({
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
        lastMessageAt: 2000,
        heartbeatWatchdog: null,
      });

      expect(mockSetSevenTvSessionId.mock.calls).toEqual([[null]]);
    },
  );

  test("reset('close') keeps the resumable session and only drops connection-scoped state", () => {
    const state = createState();
    populate(state);

    state.reset('close');

    expect(snapshotFields(state)).toEqual<SessionFieldSnapshot>({
      hasInitialSubscriptions: false,
      connectionTimestamp: 1000,
      currentEmoteSetId: 'set-a',
      activeSubscriptions: new Set(['set-a']),
      sessionId: 'session-a',
      shouldResume: true,
      resumePending: false,
      resumeFallbackTimer: null,
      subscribedChannelId: null,
      subscribedOwnerId: null,
      heartbeatIntervalMs: 45_000,
      lastMessageAt: 2000,
      heartbeatWatchdog: null,
    });

    expect(mockSetSevenTvSessionId).not.toHaveBeenCalled();
  });

  test('reset cancels the pending resume fallback and heartbeat watchdog', () => {
    const state = createState();
    const onResumeFallback = jest.fn();
    const onWatchdogTick = jest.fn();
    state.resumeFallbackTimer = setTimeout(() => onResumeFallback(), 5000);
    state.heartbeatWatchdog = setInterval(() => onWatchdogTick(), 10_000);

    state.reset('close');
    jest.advanceTimersByTime(60_000);

    expect(onResumeFallback).not.toHaveBeenCalled();

    expect(onWatchdogTick).not.toHaveBeenCalled();
  });
});

describe('sessionId', () => {
  test('reads and writes the one shared session id store', () => {
    const state = createState();

    state.sessionId = 'session-b';

    expect({
      shared: sevenTvSessionIdModule.getSevenTvSessionId(),
      state: state.sessionId,
    }).toEqual({ shared: 'session-b', state: 'session-b' });
  });
});
