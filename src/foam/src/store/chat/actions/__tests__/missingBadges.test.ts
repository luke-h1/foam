import { logger } from '@app/utils/logger';

import {
  clearAllMissingBadges,
  clearMissingBadge,
  getMissingBadgeIds,
  hasMissingBadges,
  reportMissingBadge,
} from '../missingBadges';

jest.mock('@app/utils/logger', () => ({
  logger: {
    stv: {
      warn: jest.fn(),
    },
  },
}));

const warn = jest.mocked(logger.stv.warn);

describe('missingBadges', () => {
  beforeEach(() => {
    clearAllMissingBadges();
    jest.clearAllMocks();
  });

  test('tracks a referenced-but-undefined badge and logs it once', () => {
    reportMissingBadge('badge-1', 'user-1');
    reportMissingBadge('badge-1', 'user-2');

    expect(getMissingBadgeIds()).toEqual(['badge-1']);
    expect(hasMissingBadges()).toBe(true);
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn).toHaveBeenCalledWith(
      '7TV badge entitlement has no loaded definition',
      {
        name: 'seventv.badge.missing',
        badgeId: 'badge-1',
        ttvUserId: 'user-1',
      },
    );
  });

  test('clears a badge once its definition arrives', () => {
    reportMissingBadge('badge-1');
    reportMissingBadge('badge-2');

    clearMissingBadge('badge-1');

    expect(getMissingBadgeIds()).toEqual(['badge-2']);
  });

  test('re-logs a badge that goes missing again after being cleared', () => {
    reportMissingBadge('badge-1');
    clearMissingBadge('badge-1');
    reportMissingBadge('badge-1');

    expect(warn).toHaveBeenCalledTimes(2);
  });

  test('clearAllMissingBadges empties the registry', () => {
    reportMissingBadge('badge-1');
    reportMissingBadge('badge-2');

    clearAllMissingBadges();

    expect(getMissingBadgeIds()).toEqual([]);
    expect(hasMissingBadges()).toBe(false);
  });
});
