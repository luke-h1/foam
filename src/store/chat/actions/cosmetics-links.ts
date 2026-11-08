import { evictOldestWhenFull } from '@app/utils/collection/evictOldestWhenFull';

const MAX_SEVEN_TV_USER_LINK_ENTRIES = 2000;

type EntitlementLink = {
  kind: 'BADGE' | 'PAINT' | 'EMOTE_SET';
  twitchUserId: string;
};

const entitlementLinks = new Map<string, EntitlementLink>();
const twitchIdsBySevenTvUserId = new Map<string, string[]>();
const sevenTvUserIdByTwitchId = new Map<string, string>();

function forgetEntitlementIdsForTwitchUsers(
  twitchUserIds: Iterable<string>,
): void {
  const twitchIds = new Set(twitchUserIds);

  if (twitchIds.size === 0) {
    return;
  }

  for (const [entitlementId, link] of entitlementLinks) {
    if (twitchIds.has(link.twitchUserId)) {
      entitlementLinks.delete(entitlementId);
    }
  }
}

export function rememberEntitlementTwitchLink(
  entitlementId: string,
  twitchUserId: string,
  kind: EntitlementLink['kind'],
): void {
  if (!entitlementLinks.has(entitlementId)) {
    evictOldestWhenFull(entitlementLinks, MAX_SEVEN_TV_USER_LINK_ENTRIES);
  }

  entitlementLinks.set(entitlementId, { kind, twitchUserId });
}

function evictOldestSevenTvUserLink(): void {
  const oldest = twitchIdsBySevenTvUserId.keys().next().value;

  if (oldest === undefined) {
    return;
  }

  const evictedTwitchIds = twitchIdsBySevenTvUserId.get(oldest) ?? [];

  for (const twitchId of evictedTwitchIds) {
    sevenTvUserIdByTwitchId.delete(twitchId);
  }

  forgetEntitlementIdsForTwitchUsers(evictedTwitchIds);
  twitchIdsBySevenTvUserId.delete(oldest);
}

/**
 * A Twitch account linked to a new 7TV user leaves the old user's list.
 * Otherwise an eviction or unlink of the old user wipes the current
 * cosmetics of that Twitch account.
 */
function detachFromPreviousSevenTvUser(
  twitchUserId: string,
  sevenTvUserId: string,
): void {
  const previousSevenTvUserId = sevenTvUserIdByTwitchId.get(twitchUserId);

  if (!previousSevenTvUserId || previousSevenTvUserId === sevenTvUserId) {
    return;
  }

  const previousTwitchIds = twitchIdsBySevenTvUserId.get(previousSevenTvUserId);

  if (previousTwitchIds) {
    twitchIdsBySevenTvUserId.set(
      previousSevenTvUserId,
      previousTwitchIds.filter(id => id !== twitchUserId),
    );
  }
}

export function rememberSevenTvUserTwitchLink(
  sevenTvUserId: string,
  twitchUserId: string,
): void {
  detachFromPreviousSevenTvUser(twitchUserId, sevenTvUserId);
  sevenTvUserIdByTwitchId.set(twitchUserId, sevenTvUserId);

  const cached = twitchIdsBySevenTvUserId.get(sevenTvUserId);

  if (
    !cached &&
    twitchIdsBySevenTvUserId.size >= MAX_SEVEN_TV_USER_LINK_ENTRIES
  ) {
    evictOldestSevenTvUserLink();
  }

  const existing = cached ?? [];

  if (!cached) {
    twitchIdsBySevenTvUserId.set(sevenTvUserId, existing);
  }

  if (!existing.includes(twitchUserId)) {
    existing.push(twitchUserId);
  }
}

export function getEntitlementTwitchLink(
  entitlementId: string,
): EntitlementLink | undefined {
  return entitlementLinks.get(entitlementId);
}

export function deleteEntitlementTwitchLink(entitlementId: string): void {
  entitlementLinks.delete(entitlementId);
}

export function getTwitchIdsForSevenTvUser(
  sevenTvUserId: string,
): string[] | undefined {
  return twitchIdsBySevenTvUserId.get(sevenTvUserId);
}

export function getSevenTvUserIdForTwitchId(
  twitchUserId: string,
): string | undefined {
  return sevenTvUserIdByTwitchId.get(twitchUserId);
}

export function unlinkSevenTvUser(sevenTvUserId: string): void {
  const twitchIds = twitchIdsBySevenTvUserId.get(sevenTvUserId);

  if (!twitchIds) {
    return;
  }

  twitchIds.forEach(twitchUserId => {
    sevenTvUserIdByTwitchId.delete(twitchUserId);
  });

  forgetEntitlementIdsForTwitchUsers(twitchIds);
  twitchIdsBySevenTvUserId.delete(sevenTvUserId);
}

export function clearEntitlementUserLinkState(): void {
  twitchIdsBySevenTvUserId.clear();
  sevenTvUserIdByTwitchId.clear();
  entitlementLinks.clear();
}
