import { logger } from '@app/utils/logger';
import { boundedSetAdd } from '@app/utils/object/boundedSetAdd';

import {
  getUserBadge,
  getUserBadgeId,
  getUserPaintId,
  requestUserCosmeticsViaPresence,
} from './cosmetics';

const MAX_FETCHED_COSMETICS_USERS = 500;

/**
 * Chatters whose cosmetics this session already requested. A plain bounded
 * module Set (see chatColorCaches): it is only ever read imperatively during
 * ingest and the hydrate pass, never rendered.
 */
const fetchedCosmeticsUsers = new Set<string>();

function getRenderableBadgeUrl(twitchUserId: string): string | undefined {
  const badgeId = getUserBadgeId(twitchUserId);
  return badgeId ? getUserBadge(twitchUserId)?.url?.trim() : undefined;
}

export function hasRenderableCosmetics(twitchUserId: string): boolean {
  return Boolean(
    getUserPaintId(twitchUserId) || getRenderableBadgeUrl(twitchUserId),
  );
}

export async function fetchUserCosmetics(
  twitchUserId: string,
  fetchOptions: {
    retryMissingBadge?: boolean;
  } = {},
): Promise<void> {
  const existingBadgeId = getUserBadgeId(twitchUserId);
  const renderableBadge = getRenderableBadgeUrl(twitchUserId);

  if (
    fetchedCosmeticsUsers.has(twitchUserId) &&
    (!fetchOptions.retryMissingBadge || renderableBadge || !existingBadgeId)
  ) {
    return;
  }

  if (hasRenderableCosmetics(twitchUserId)) {
    boundedSetAdd(
      fetchedCosmeticsUsers,
      twitchUserId,
      MAX_FETCHED_COSMETICS_USERS,
    );
    return;
  }

  boundedSetAdd(
    fetchedCosmeticsUsers,
    twitchUserId,
    MAX_FETCHED_COSMETICS_USERS,
  );

  try {
    await requestUserCosmeticsViaPresence(twitchUserId);
  } catch (error) {
    logger.stv.debug(
      `Failed to fetch cosmetics for user ${twitchUserId}:`,
      error instanceof Error ? error.message : error,
    );
  }
}

/**
 * Called on chat unmount so the next session re-requests cosmetics.
 */
export function clearFetchedCosmeticsUsers(): void {
  fetchedCosmeticsUsers.clear();
}
