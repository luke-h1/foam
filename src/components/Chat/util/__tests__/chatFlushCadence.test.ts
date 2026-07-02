import {
  pickFlushDelay,
  sampleLiveCommit,
  shouldEnterRaidFlushMode,
} from '../chatFlushCadence';

describe('pickFlushDelay', () => {
  test('returns the 100ms live interval when following the bottom', () => {
    expect(
      pickFlushDelay({
        isAtBottom: true,
        raidMode: false,
        scrollingToBottom: false,
      }),
    ).toEqual(100);
  });

  test('returns the slowed 180ms interval when following the bottom in raid mode', () => {
    expect(
      pickFlushDelay({
        isAtBottom: true,
        raidMode: true,
        scrollingToBottom: false,
      }),
    ).toEqual(180);
  });

  test('returns the live interval while scrolling back to the bottom', () => {
    expect(
      pickFlushDelay({
        isAtBottom: false,
        raidMode: false,
        scrollingToBottom: true,
      }),
    ).toEqual(100);
  });

  test('returns the raid interval while scrolling back to the bottom in raid mode', () => {
    expect(
      pickFlushDelay({
        isAtBottom: false,
        raidMode: true,
        scrollingToBottom: true,
      }),
    ).toEqual(180);
  });

  test('returns the 250ms backlog interval while reading scrollback', () => {
    expect(
      pickFlushDelay({
        isAtBottom: false,
        raidMode: false,
        scrollingToBottom: false,
      }),
    ).toEqual(250);
  });

  test('backlog interval wins over raid mode while reading scrollback', () => {
    expect(
      pickFlushDelay({
        isAtBottom: false,
        raidMode: true,
        scrollingToBottom: false,
      }),
    ).toEqual(250);
  });
});

describe('shouldEnterRaidFlushMode', () => {
  test('enters raid mode when a live flush commits more than 8 messages', () => {
    expect(shouldEnterRaidFlushMode(9, true)).toEqual(true);
  });

  test('stays in normal mode at exactly the 8-message threshold', () => {
    expect(shouldEnterRaidFlushMode(8, true)).toEqual(false);
  });

  test('never enters raid mode while reading scrollback', () => {
    expect(shouldEnterRaidFlushMode(50, false)).toEqual(false);
  });
});

describe('sampleLiveCommit', () => {
  test('commits only the newest 3 messages when following a raid live', () => {
    expect(sampleLiveCommit(['m1', 'm2', 'm3', 'm4', 'm5'], true)).toEqual([
      'm3',
      'm4',
      'm5',
    ]);
  });

  test('commits every message when the batch fits the per-flush cap', () => {
    expect(sampleLiveCommit(['m1', 'm2', 'm3'], true)).toEqual([
      'm1',
      'm2',
      'm3',
    ]);
  });

  test('keeps the whole batch while reading scrollback', () => {
    const backlog = Array.from({ length: 20 }, (_, i) => `m${i}`);
    expect(sampleLiveCommit(backlog, false)).toEqual(backlog);
  });
});
