import { batch } from '@legendapp/state';

import {
  get7TvCosmeticId,
  sanitise7TvBadge,
  toPaintWithId,
} from '@app/components/Chat/util/normalizeSevenTvCosmetics';
import { sevenTvService } from '@app/services/seventv-service';
import type {
  CosmeticCreate,
  EntitlementCreate,
} from '@app/types/seventv/cosmetics';
import { logger } from '@app/utils/logger';
import {
  interpretSeventvWsMessage,
  type SeventvWsDecision,
} from '@app/utils/seventv/seventvWsInterpreter';

import { chatStore$ } from '../observables/chatStore';
import {
  addBadge,
  addPaint,
  getBadge,
  getPaint,
  setUserBadge,
  setUserPaint,
} from './cosmetics';
import { handlePersonalEmoteSetEntitlement } from './personalEmotes';

// Collect ids for a short window so a hydration pass / entitlement burst
// lands as one bridge request instead of one request per chatter.
const BRIDGE_FLUSH_DELAY_MS = 500;
const MAX_IDENTIFIERS_PER_REQUEST = 100;

// Session dedup so entitlement bursts and repeated hydration passes cannot
// re-request the same user; bounded the same way as the other per-chatter
// guards so a marathon session cannot grow it unbounded.
const MAX_REQUESTED_USER_ENTRIES = 2000;
const requestedUsers = new Map<string, Promise<void>>();

let pendingUserIds = new Set<string>();
let pendingFlush: {
  promise: Promise<void>;
  resolve: () => void;
  timer: ReturnType<typeof setTimeout>;
} | null = null;

export const applyCosmeticCreateEvent = (
  cosmetic: CosmeticCreate,
  kind: 'PAINT' | 'BADGE',
): void => {
  if (kind === 'BADGE' && cosmetic.object.kind === 'BADGE') {
    const badgeData = cosmetic.object.data;
    const badgeId = get7TvCosmeticId(badgeData);
    if (getBadge(badgeId)) {
      return;
    }
    addBadge(sanitise7TvBadge(badgeData, badgeId));
    logger.stvWs.info(
      `Added badge to cache: ${badgeData.name} (id: ${badgeId})`,
    );
  } else if (kind === 'PAINT' && cosmetic.object.kind === 'PAINT') {
    const paintData = cosmetic.object.data;
    const paintWithId = toPaintWithId(paintData);
    if (getPaint(paintWithId.id)) {
      return;
    }
    addPaint(paintWithId);
    logger.stvWs.info(
      `Added paint to cache: ${paintData.name} (id: ${paintWithId.id})`,
    );
  }
};

/**
 * Bind an entitlement to its Twitch user. When the referenced cosmetic has no
 * loaded definition yet, the user is queued on the bridge batcher so the
 * definition arrives shortly after — no fetch window, nothing is dropped.
 * Bridge responses themselves apply with `requestMissingDefinitions: false`
 * so an entitlement whose definition 7TV never returns cannot loop.
 */
export const applyEntitlementCreateEvent = (
  data: {
    entitlement: EntitlementCreate;
    kind: 'BADGE' | 'PAINT' | 'EMOTE_SET';
    ttvUserId: string | null;
    paintId: string | null;
    badgeId: string | null;
  },
  options: { requestMissingDefinitions: boolean },
): void => {
  const { entitlement, kind, ttvUserId } = data;
  const cosmeticId = entitlement.object.ref_id;

  if (kind === 'PAINT') {
    const paintId = cosmeticId || data.paintId;
    if (!paintId || !ttvUserId) {
      return;
    }
    setUserPaint(ttvUserId, paintId);
    if (!getPaint(paintId) && options.requestMissingDefinitions) {
      void requestUserCosmetics(ttvUserId);
    }
  }

  if (kind === 'BADGE') {
    const badgeId = cosmeticId || data.badgeId;
    if (!badgeId || !ttvUserId) {
      return;
    }
    setUserBadge(ttvUserId, badgeId);
    if (!getBadge(badgeId) && options.requestMissingDefinitions) {
      void requestUserCosmetics(ttvUserId);
    }
  }

  if (kind === 'EMOTE_SET' && ttvUserId && cosmeticId) {
    handlePersonalEmoteSetEntitlement(
      ttvUserId,
      cosmeticId,
      chatStore$.currentChannelId.peek(),
    );
  }
};

const applyBridgeDecision = (decision: SeventvWsDecision): void => {
  switch (decision.type) {
    case 'applyCosmeticCreate':
      applyCosmeticCreateEvent(decision.cosmetic, decision.kind);
      break;
    case 'applyEntitlementCreate':
      applyEntitlementCreateEvent(decision, {
        requestMissingDefinitions: false,
      });
      break;
    case 'eventInterpretationFailed':
      logger.stv.warn('Failed to interpret 7TV bridge event', {
        name: 'seven_tv_cosmetics_warning',
        error: decision.error,
        action: 'bridge_event_interpretation_failed',
        event_type: decision.eventType,
        provider: 'seven_tv',
        resource_type: 'cosmetics',
      });
      break;
    default:
      break;
  }
};

const flushPendingUsers = async (userIds: string[]): Promise<void> => {
  for (
    let start = 0;
    start < userIds.length;
    start += MAX_IDENTIFIERS_PER_REQUEST
  ) {
    const chunk = userIds.slice(start, start + MAX_IDENTIFIERS_PER_REQUEST);
    try {
      // eslint-disable-next-line react-doctor/async-await-in-loop -- chunks run sequentially to keep one bridge request in flight at a time
      const events = await sevenTvService.fetchBridgedCosmetics(chunk);
      batch(() => {
        events.forEach(event => {
          const decisions = interpretSeventvWsMessage(
            { op: 0, d: event },
            {
              expectedEmoteSetId: undefined,
              connectionTimestamp: null,
              channelId: undefined,
              now: Date.now(),
            },
          );
          decisions.forEach(applyBridgeDecision);
        });
      });
    } catch (error) {
      // Forget failed ids so a later hydration pass can retry them.
      chunk.forEach(id => requestedUsers.delete(id));
      logger.stv.warn('7TV bridge cosmetics request failed', {
        name: 'seven_tv_cosmetics_warning',
        error,
        action: 'bridge_cosmetics_failed',
        provider: 'seven_tv',
        resource_type: 'cosmetics',
        user_count: chunk.length,
      });
    }
  }
};

/**
 * Queue a Twitch user for a batched bridge cosmetics lookup. The returned
 * promise resolves once the batch containing the user has been applied to the
 * store, so callers can re-check the cosmetic maps afterwards.
 */
export const requestUserCosmetics = (twitchUserId: string): Promise<void> => {
  const existing = requestedUsers.get(twitchUserId);
  if (existing) {
    return existing;
  }

  if (!pendingFlush) {
    let resolve!: () => void;
    const promise = new Promise<void>(promiseResolve => {
      resolve = promiseResolve;
    });
    const timer = setTimeout(() => {
      const userIds = Array.from(pendingUserIds);
      const flush = pendingFlush;
      pendingUserIds = new Set();
      pendingFlush = null;
      void flushPendingUsers(userIds).finally(() => flush?.resolve());
    }, BRIDGE_FLUSH_DELAY_MS);
    pendingFlush = { promise, resolve, timer };
  }

  pendingUserIds.add(twitchUserId);
  requestedUsers.set(twitchUserId, pendingFlush.promise);
  if (requestedUsers.size > MAX_REQUESTED_USER_ENTRIES) {
    const oldest = requestedUsers.keys().next().value;
    if (oldest !== undefined) {
      requestedUsers.delete(oldest);
    }
  }

  return pendingFlush.promise;
};

export const clearBridgeCosmeticsState = (): void => {
  if (pendingFlush) {
    clearTimeout(pendingFlush.timer);
    pendingFlush.resolve();
    pendingFlush = null;
  }
  pendingUserIds = new Set();
  requestedUsers.clear();
};
