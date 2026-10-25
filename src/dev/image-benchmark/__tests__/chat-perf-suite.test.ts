import { SUITE_PHASES, SUITE_TOTAL_MS } from '../chat-perf-suite';
import { SYNTHETIC_PRESETS } from '../synthetic-chat-control';

describe('chat-perf-suite', () => {
  test('is 2 minutes of medium then heavy', () => {
    expect(SUITE_TOTAL_MS).toEqual(120_000);

    expect(SUITE_PHASES).toEqual([
      { preset: 'medium', measureMs: 50_000 },
      { preset: 'heavy', measureMs: 50_000 },
    ]);
  });

  test('medium and heavy alias steady60 and raid', () => {
    expect(SYNTHETIC_PRESETS['medium']).toEqual(SYNTHETIC_PRESETS['steady60']);

    expect(SYNTHETIC_PRESETS['heavy']).toEqual(SYNTHETIC_PRESETS['raid']);
  });
});
