import { logger } from '@app/utils/logger';

/**
 * A badge entitlement (userBadgeIds) can arrive before — or without — the
 * cosmetic.create that defines the badge, leaving a user pointing at a badge we
 * cannot render. This registry makes that gap observable instead of a silently
 * empty slot: referenced-but-undefined badge ids are tracked and logged once
 * each, and cleared when the definition later arrives.
 */
const missingBadgeIds = new Set<string>();
const loggedMissingBadgeIds = new Set<string>();

export const reportMissingBadge = (
  badgeId: string,
  ttvUserId?: string,
): void => {
  missingBadgeIds.add(badgeId);
  if (loggedMissingBadgeIds.has(badgeId)) {
    return;
  }
  loggedMissingBadgeIds.add(badgeId);
  logger.stv.warn('7TV badge entitlement has no loaded definition', {
    name: 'seventv.badge.missing',
    badgeId,
    ...(ttvUserId ? { ttvUserId } : {}),
  });
};

export const clearMissingBadge = (badgeId: string): void => {
  missingBadgeIds.delete(badgeId);
  loggedMissingBadgeIds.delete(badgeId);
};

export const clearAllMissingBadges = (): void => {
  missingBadgeIds.clear();
  loggedMissingBadgeIds.clear();
};

/**
 * Badge ids referenced by an entitlement whose definition never loaded.
 */
export const getMissingBadgeIds = (): string[] => Array.from(missingBadgeIds);

export const hasMissingBadges = (): boolean => missingBadgeIds.size > 0;
