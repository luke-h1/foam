import {
  createStabilityRecovery,
  type StabilityRefreshReason,
} from '../util/stabilityRecovery';

describe('createStabilityRecovery', () => {
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

    const reportHighLatency = () => {
      stability.noteLatency(25);
      stability.noteLatency(25);
      stability.noteLatency(25);
    };

    return { giveUps, refreshes, reportHighLatency, stability };
  };

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

  test('playback starting resets the consecutive high-latency count', () => {
    const now = { current: 10_000 };
    const { refreshes, stability } = create(now);

    stability.noteLatency(25);
    stability.noteLatency(25);
    stability.notePlaying();
    stability.noteLatency(25);

    expect(refreshes).toEqual([]);
  });

  test('gives up after 3 refreshes inside the 120s window and reports it once', () => {
    const now = { current: 10_000 };
    const { giveUps, refreshes, reportHighLatency } = create(now);

    for (let attempt = 0; attempt < 5; attempt += 1) {
      reportHighLatency();
      now.current += 1000;
    }

    expect(refreshes).toEqual([
      { attempt: 1, reason: 'highLatency' },
      { attempt: 2, reason: 'highLatency' },
      { attempt: 3, reason: 'highLatency' },
    ]);

    expect(giveUps).toEqual([{ reason: 'highLatency', refreshCount: 3 }]);
  });

  test('refresh budget recovers once old refreshes age out of the 120s window', () => {
    const now = { current: 10_000 };
    const { refreshes, reportHighLatency } = create(now);

    reportHighLatency();
    reportHighLatency();
    reportHighLatency();
    now.current += 120_000;
    reportHighLatency();

    expect(refreshes).toEqual([
      { attempt: 1, reason: 'highLatency' },
      { attempt: 2, reason: 'highLatency' },
      { attempt: 3, reason: 'highLatency' },
      { attempt: 1, reason: 'highLatency' },
    ]);
  });

  test('reset clears the refresh window, latency readings, and the gave-up latch', () => {
    const now = { current: 10_000 };
    const { giveUps, refreshes, reportHighLatency, stability } = create(now);

    reportHighLatency();
    reportHighLatency();
    reportHighLatency();
    reportHighLatency();
    expect(giveUps).toEqual([{ reason: 'highLatency', refreshCount: 3 }]);

    stability.noteLatency(25);
    stability.noteLatency(25);
    stability.reset();
    stability.noteLatency(25);

    expect(refreshes).toEqual([
      { attempt: 1, reason: 'highLatency' },
      { attempt: 2, reason: 'highLatency' },
      { attempt: 3, reason: 'highLatency' },
    ]);

    reportHighLatency();
    reportHighLatency();
    reportHighLatency();
    reportHighLatency();

    expect(refreshes).toEqual([
      { attempt: 1, reason: 'highLatency' },
      { attempt: 2, reason: 'highLatency' },
      { attempt: 3, reason: 'highLatency' },
      { attempt: 1, reason: 'highLatency' },
      { attempt: 2, reason: 'highLatency' },
      { attempt: 3, reason: 'highLatency' },
    ]);

    expect(giveUps).toEqual([
      { reason: 'highLatency', refreshCount: 3 },
      { reason: 'highLatency', refreshCount: 3 },
    ]);
  });
});
