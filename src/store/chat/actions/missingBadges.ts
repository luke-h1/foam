import { logger } from '@app/utils/logger';

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
  missingBadgeIds.add(badgeId);
  if (loggedMissingBadgeIds.has(badgeId)) {
    return;
  }
  loggedMissingBadgeIds.add(badgeId);
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
