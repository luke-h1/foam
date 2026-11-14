import { measureFunction } from 'reassure';

import { findBadges } from '@app/utils/chat/findBadges';

import {
  badgeLookupUserstates,
  denseBadgeSources,
} from '../__fixtures__/findBadges.perf.fixture';

const MEASURE_OPTIONS = {
  runs: 5,
  warmupRuns: 1,
} as const;

describe('findBadges performance', () => {
  test('resolves badges against dense provider maps', async () => {
    findBadges({
      ...denseBadgeSources,
      userstate: badgeLookupUserstates[0]!,
    });

    await measureFunction(() => {
      for (const userstate of badgeLookupUserstates) {
        findBadges({
          ...denseBadgeSources,
          userstate,
        });
      }
    }, MEASURE_OPTIONS);
  });
});
