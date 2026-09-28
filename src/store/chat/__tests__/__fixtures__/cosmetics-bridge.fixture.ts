import type { EntitlementCreate } from '@app/types/seventv/cosmetics';

export function createBadgeEntitlement(
  badgeId: string,
  ttvUserId: string,
  entitlementId = `entitlement-${badgeId}`,
): EntitlementCreate {
  return {
    id: entitlementId,
    kind: 0,
    object: {
      id: entitlementId,
      kind: 'BADGE',
      ref_id: badgeId,
      user: {
        id: 'stv-user-1',
        username: 'user',
        display_name: 'User',
        avatar_url: '',
        style: { badge_id: badgeId },
        role_ids: { length: 0 },
        connections: {
          0: {
            id: ttvUserId,
            platform: 'TWITCH',
            username: 'user',
            display_name: 'User',
            linked_at: 0,
            emote_capacity: 0,
            emote_set_id: '',
          },
          length: 1,
        },
      },
    },
  };
}
