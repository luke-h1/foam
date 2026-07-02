import type {
  CosmeticCreateCallbackData,
  CosmeticDeleteCallbackData,
  CosmeticUpdateCallbackData,
  EntitlementCreateCallbackData,
  EntitlementDeleteCallbackData,
  EntitlementUpdateCallbackData,
  EntitlementUser,
  SevenTvEventData,
} from '@app/types/seventv/cosmetics';
import { logger } from '@app/utils/logger';

export interface CosmeticSyncDeps {
  onCosmeticCreate: ((data: CosmeticCreateCallbackData) => void) | undefined;
  onCosmeticUpdate: ((data: CosmeticUpdateCallbackData) => void) | undefined;
  onCosmeticDelete: ((data: CosmeticDeleteCallbackData) => void) | undefined;
  onEntitlementCreate:
    ((data: EntitlementCreateCallbackData) => void) | undefined;
  onEntitlementUpdate:
    ((data: EntitlementUpdateCallbackData) => void) | undefined;
  onEntitlementDelete:
    ((data: EntitlementDeleteCallbackData) => void) | undefined;
}

function findTwitchUserId(
  connections: EntitlementUser['connections'] | undefined,
): string | null {
  if (!connections) {
    return null;
  }

  for (let i = 0; i < connections.length; i += 1) {
    const conn = connections[i];
    if (conn?.platform === 'TWITCH') {
      return conn.id;
    }
  }

  return null;
}

export function handleCosmeticCreate(
  data: SevenTvEventData<'cosmetic.create'>,
  deps: CosmeticSyncDeps,
): void {
  try {
    const cosmeticKind = data.body.object.kind;

    if (cosmeticKind === 'PAINT' || cosmeticKind === 'BADGE') {
      if (deps.onCosmeticCreate) {
        deps.onCosmeticCreate({
          cosmetic: data.body,
          kind: cosmeticKind,
        });
      }
    }
  } catch (e) {
    logger.chat.error('Error handling cosmetic.create:', e);
  }
}

export function handleCosmeticUpdate(
  data: SevenTvEventData<'cosmetic.update'>,
  deps: CosmeticSyncDeps,
): void {
  try {
    const changes = data.body;
    let kind: 'PAINT' | 'BADGE' | null = null;

    if (changes.updated) {
      // eslint-disable-next-line no-restricted-syntax
      for (const update of changes.updated) {
        if (update.value && typeof update.value === 'object') {
          if ('object' in update.value && update.value.object) {
            kind = update.value.object.kind === 'BADGE' ? 'BADGE' : 'PAINT';
            break;
          }
        }
      }
    }

    if (!kind && changes.pushed) {
      // eslint-disable-next-line no-restricted-syntax
      for (const push of changes.pushed) {
        if (push.value && typeof push.value === 'object') {
          if ('object' in push.value && push.value.object) {
            kind = push.value.object.kind === 'BADGE' ? 'BADGE' : 'PAINT';
            break;
          }
        }
      }
    }

    if (deps.onCosmeticUpdate) {
      deps.onCosmeticUpdate({
        changes,
        kind,
      });
    }
  } catch (e) {
    logger.chat.error('Error handling cosmetic.update:', e);
  }
}

export function handleCosmeticDelete(
  data: SevenTvEventData<'cosmetic.delete'>,
  deps: CosmeticSyncDeps,
): void {
  try {
    const cosmeticId = data.body.id;
    if (deps.onCosmeticDelete) {
      deps.onCosmeticDelete({
        cosmeticId,
      });
    }
  } catch (e) {
    logger.chat.error('Error handling cosmetic.delete:', e);
  }
}

export function handleEntitlementCreate(
  data: SevenTvEventData<'entitlement.create'>,
  deps: CosmeticSyncDeps,
): void {
  try {
    const { body } = data;
    const { object } = body;
    const { kind: entitlementKind, user } = object;

    const ttvUserId = findTwitchUserId(user.connections);
    const paintId = user.style?.paint_id ?? null;
    const badgeId = user.style?.badge_id ?? null;

    logger.stvWs.info(
      `Entitlement create: ${entitlementKind} for user ${user.display_name} (ttv: ${ttvUserId}, paint: ${paintId}, badge: ${badgeId})`,
    );

    if (deps.onEntitlementCreate) {
      deps.onEntitlementCreate({
        entitlement: body,
        kind: entitlementKind,
        ttvUserId,
        paintId,
        badgeId,
      });
    }
  } catch (e) {
    logger.chat.error('Error handling entitlement.create:', e);
  }
}

export function handleEntitlementUpdate(
  data: SevenTvEventData<'entitlement.update'>,
  deps: CosmeticSyncDeps,
): void {
  try {
    const changes = data.body;
    let ttvUserId: string | null = null;
    let paintId: string | null = null;
    let badgeId: string | null = null;

    if (changes.updated) {
      // eslint-disable-next-line no-restricted-syntax
      for (const update of changes.updated) {
        if (update.value && typeof update.value === 'object') {
          if ('object' in update.value && update.value.object) {
            const { user } = update.value.object;
            if (user) {
              const foundTtvUserId = findTwitchUserId(user.connections);
              if (foundTtvUserId) {
                ttvUserId = foundTtvUserId;
              }
              paintId = user.style?.paint_id ?? null;
              badgeId = user.style?.badge_id ?? null;
            }
          }
        }
      }
    }

    if (deps.onEntitlementUpdate) {
      deps.onEntitlementUpdate({
        changes,
        ttvUserId,
        paintId,
        badgeId,
      });
    }
  } catch (e) {
    logger.chat.error('Error handling entitlement.update:', e);
  }
}

export function handleEntitlementDelete(
  data: SevenTvEventData<'entitlement.delete'>,
  deps: CosmeticSyncDeps,
): void {
  try {
    const entitlementId = data.body.id;
    if (deps.onEntitlementDelete) {
      deps.onEntitlementDelete({
        entitlementId,
        ttvUserId: null, // Will be resolved in the store
      });
    }
  } catch (e) {
    logger.chat.error('Error handling entitlement.delete:', e);
  }
}
