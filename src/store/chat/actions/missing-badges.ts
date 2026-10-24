import { logger } from '@app/utils/logger';
import { boundedSetAdd } from '@app/utils/object/bounded-set-add';

const MAX_MISSING_BADGE_IDS = 500;

/**
 * Tracks badge ids referenced by an entitlement before - or without - the
 * cosmetic.create that defines them; logs each once.
 */
const missingBadgeIds = new Set<string>();

const loggedMissingBadgeIds = new Set<string>();

interface MissingBadgeLogContext {
  name: string;
  badgeId: string;
  ttvUserId?: string;
}

export const reportMissingBadge = (
  badgeId: string,
  ttvUserId?: string,
): void => {
  boundedSetAdd(missingBadgeIds, badgeId, MAX_MISSING_BADGE_IDS);

  if (loggedMissingBadgeIds.has(badgeId)) {
    return;
  }

  boundedSetAdd(loggedMissingBadgeIds, badgeId, MAX_MISSING_BADGE_IDS);

  const context: MissingBadgeLogContext = {
    name: 'seventv.badge.missing',
    badgeId,
  };

  if (ttvUserId) {
    context.ttvUserId = ttvUserId;
  }

  logger.stv.warn('7TV badge entitlement has no loaded definition', context);
};

export const clearMissingBadge = (badgeId: string): void => {
  missingBadgeIds.delete(badgeId);
  loggedMissingBadgeIds.delete(badgeId);
};

export const clearAllMissingBadges = (): void => {
  missingBadgeIds.clear();
  loggedMissingBadgeIds.clear();
};

export const getMissingBadgeIds = (): string[] => Array.from(missingBadgeIds);

export const hasMissingBadges = (): boolean => missingBadgeIds.size > 0;
