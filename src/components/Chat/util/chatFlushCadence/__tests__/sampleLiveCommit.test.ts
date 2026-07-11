import { sampleLiveCommit } from '../sampleLiveCommit';

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
