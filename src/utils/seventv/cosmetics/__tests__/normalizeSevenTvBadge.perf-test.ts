import { measureFunction } from 'reassure';

import { normalizeSevenTvBadge } from '@app/utils/seventv/cosmetics/normalizeSevenTvBadge';

import { badgeRows } from './__fixtures__/normalizeSevenTvBadge.perf.fixture';

const MEASURE_OPTIONS = {
  runs: 5,
  warmupRuns: 1,
} as const;

describe('normalizeSevenTvBadge performance', () => {
  test('re-normalises a screenful of badges the way repeated row renders do', async () => {
    await measureFunction(() => {
      // Eight passes over the same badge objects: a row re-renders far more
      // often than its badges change, so this is the steady state.
      for (let pass = 0; pass < 8; pass += 1) {
        for (const badges of badgeRows) {
          for (const badge of badges) {
            normalizeSevenTvBadge(badge);
          }
        }
      }
    }, MEASURE_OPTIONS);
  });
});
