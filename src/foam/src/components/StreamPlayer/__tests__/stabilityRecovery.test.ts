import {
  createStabilityRecovery,
  type StabilityRefreshReason,
} from '../stabilityRecovery';

describe('createStabilityRecovery', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  const create = (nowValue: { current: number }) => {
    const refreshes: { attempt: number; reason: StabilityRefreshReason }[] = [];
    const giveUps: { reason: StabilityRefreshReason; refreshCount: number }[] =
      [];
    const stability = createStabilityRecovery({
      now: () => nowValue.current,
      onRefresh: (reason, attempt) => refreshes.push({ attempt, reason }),
      onGiveUp: (reason, refreshCount) =>
        giveUps.push({ reason, refreshCount }),
    });
    return { giveUps, refreshes, stability };
  };

  test('a stall refreshes only after the 4s grace period', () => {
    const now = { current: 10_000 };
    const { refreshes, stability } = create(now);

    stability.noteStalled();
    jest.advanceTimersByTime(3_999);
    expect(refreshes).toEqual([]);

    jest.advanceTimersByTime(1);
    expect(refreshes).toEqual([{ attempt: 1, reason: 'stall' }]);
  });

  test('playback recovering inside the grace period cancels the refresh', () => {
    const now = { current: 10_000 };
    const { refreshes, stability } = create(now);

    stability.noteStalled();
    jest.advanceTimersByTime(3_000);
    stability.noteRecovered();
    jest.advanceTimersByTime(10_000);

    expect(refreshes).toEqual([]);
  });

  test('a second stall report while the grace timer is armed does not stack timers', () => {
    const now = { current: 10_000 };
    const { refreshes, stability } = create(now);

    stability.noteStalled();
    jest.advanceTimersByTime(2_000);
    stability.noteStalled();
    jest.advanceTimersByTime(2_000);

    expect(refreshes).toEqual([{ attempt: 1, reason: 'stall' }]);
  });

  test('a video element error refreshes immediately and cancels a pending stall refresh', () => {
    const now = { current: 10_000 };
    const { refreshes, stability } = create(now);

    stability.noteStalled();
    stability.noteVideoError();
    jest.advanceTimersByTime(10_000);

    expect(refreshes).toEqual([{ attempt: 1, reason: 'videoElementError' }]);
  });

  test('high latency must persist for 3 consecutive readings before refreshing', () => {
    const now = { current: 10_000 };
    const { refreshes, stability } = create(now);

    stability.noteLatency(25);
    stability.noteLatency(25);
    expect(refreshes).toEqual([]);

    stability.noteLatency(25);
    expect(refreshes).toEqual([{ attempt: 1, reason: 'highLatency' }]);
  });

  test('a healthy latency reading resets the consecutive high-latency count', () => {
    const now = { current: 10_000 };
    const { refreshes, stability } = create(now);

    stability.noteLatency(25);
    stability.noteLatency(25);
    stability.noteLatency(3);
    stability.noteLatency(25);
    stability.noteLatency(25);

    expect(refreshes).toEqual([]);
  });

  test('gives up after 3 refreshes inside the 120s window and reports it once', () => {
    const now = { current: 10_000 };
    const { giveUps, refreshes, stability } = create(now);

    stability.noteVideoError();
    now.current += 1_000;
    stability.noteVideoError();
    now.current += 1_000;
    stability.noteVideoError();
    now.current += 1_000;
    stability.noteVideoError();
    now.current += 1_000;
    stability.noteVideoError();

    expect(refreshes).toEqual([
      { attempt: 1, reason: 'videoElementError' },
      { attempt: 2, reason: 'videoElementError' },
      { attempt: 3, reason: 'videoElementError' },
    ]);
    expect(giveUps).toEqual([{ reason: 'videoElementError', refreshCount: 3 }]);
  });

  test('refresh budget recovers once old refreshes age out of the 120s window', () => {
    const now = { current: 10_000 };
    const { refreshes, stability } = create(now);

    stability.noteVideoError();
    stability.noteVideoError();
    stability.noteVideoError();
    now.current += 120_000;
    stability.noteVideoError();

    expect(refreshes).toEqual([
      { attempt: 1, reason: 'videoElementError' },
      { attempt: 2, reason: 'videoElementError' },
      { attempt: 3, reason: 'videoElementError' },
      { attempt: 1, reason: 'videoElementError' },
    ]);
  });

  test('reset clears the refresh window, latency readings, and the gave-up latch', () => {
    const now = { current: 10_000 };
    const { giveUps, refreshes, stability } = create(now);

    stability.noteVideoError();
    stability.noteVideoError();
    stability.noteVideoError();
    stability.noteVideoError();
    expect(giveUps).toEqual([{ reason: 'videoElementError', refreshCount: 3 }]);

    stability.reset();
    stability.noteVideoError();

    expect(refreshes).toEqual([
      { attempt: 1, reason: 'videoElementError' },
      { attempt: 2, reason: 'videoElementError' },
      { attempt: 3, reason: 'videoElementError' },
      { attempt: 1, reason: 'videoElementError' },
    ]);
  });

  test('dispose cancels a pending stall refresh', () => {
    const now = { current: 10_000 };
    const { refreshes, stability } = create(now);

    stability.noteStalled();
    stability.dispose();
    jest.advanceTimersByTime(10_000);

    expect(refreshes).toEqual([]);
  });
});
