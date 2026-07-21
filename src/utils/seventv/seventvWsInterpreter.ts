import { EmoteSetKind } from '@app/graphql/generated/gql';
import type { SanitisedEmote } from '@app/types/emote';
import type {
  ChangeMap,
  CosmeticCreate,
  EntitlementCreate,
  EntitlementUser,
  SevenTvEventData,
  SevenTvEventType,
  SevenTvWsMessage,
} from '@app/types/seventv/cosmetics';
import type { SevenTvEmote, SevenTvFile } from '@app/types/seventv/emotes';
import type { StvUser } from '@app/types/seventv/users';
import { deriveEmoteImageVariantsFromUrl } from '@app/utils/emote/emoteImageVariants/deriveEmoteImageVariantsFromUrl';

export const HISTORICAL_EVENT_BUFFER = 10000; // 10 seconds

export interface EmoteUpdateCallbackData {
  added: SanitisedEmote[];
  removed: SanitisedEmote[];
  channelId: string;
}

export interface SeventvWsInterpreterContext {
  expectedEmoteSetId: string | undefined;
  connectionTimestamp: number | null;
  channelId: string | undefined;
  now: number;
}

export type HandledSevenTvEventType =
  | 'emote_set.update'
  | 'user.update'
  | 'cosmetic.create'
  | 'cosmetic.update'
  | 'cosmetic.delete'
  | 'entitlement.create'
  | 'entitlement.update'
  | 'entitlement.delete'
  | 'entitlement.reset';

export type SeventvWsDecision =
  | {
      type: 'applyEmoteUpdate';
      added: SanitisedEmote[];
      removed: SanitisedEmote[];
      channelId: string;
    }
  | {
      type: 'ignoreEmoteSetUpdate';
      reason: 'inactiveEmoteSet' | 'historicalEvent' | 'noChanges';
    }
  | {
      type: 'emoteSetUpdateForOtherSet';
      emoteSetId: string;
    }
  | {
      type: 'applyCosmeticCreate';
      cosmetic: CosmeticCreate;
      kind: 'PAINT' | 'BADGE';
    }
  | { type: 'ignoreCosmeticCreate'; reason: 'unsupportedKind' }
  | {
      type: 'applyCosmeticUpdate';
      changes: ChangeMap<CosmeticCreate>;
      kind: 'PAINT' | 'BADGE' | null;
    }
  | { type: 'applyCosmeticDelete'; cosmeticId: string }
  | {
      type: 'applyEntitlementCreate';
      entitlement: EntitlementCreate;
      kind: 'BADGE' | 'PAINT' | 'EMOTE_SET';
      ttvUserId: string | null;
      paintId: string | null;
      badgeId: string | null;
      userDisplayName: string;
    }
  | {
      type: 'applyEntitlementUpdate';
      changes: ChangeMap<EntitlementCreate>;
      ttvUserId: string | null;
      paintId: string | null;
      badgeId: string | null;
    }
  | { type: 'applyEntitlementDelete'; entitlementId: string; ttvUserId: null }
  | { type: 'applyEntitlementReset'; sevenTvUserId: string }
  | {
      type: 'applyEmoteSetSwitch';
      oldSetId: string | null;
      newSetId: string;
      newSetName: string | null;
    }
  | { type: 'ignoreUserUpdate'; reason: 'noEmoteSetChange' | 'historicalEvent' }
  | {
      type: 'eventInterpretationFailed';
      eventType: HandledSevenTvEventType;
      error: unknown;
    }
  | { type: 'unhandledEventType'; eventType: SevenTvEventType }
  | {
      type: 'notifyEvent';
      eventType: SevenTvEventType;
      data: SevenTvEventData<SevenTvEventType>;
    }
  | {
      type: 'ignoreDispatch';
      reason: 'missingEventData' | 'malformedEventData';
    }
  | { type: 'heartbeat'; count: number }
  | { type: 'ack'; command: string }
  | {
      type: 'resumeAck';
      success: boolean;
      dispatchesReplayed: number;
      subscriptionsRestored: number;
    }
  | {
      type: 'hello';
      sessionId: string | null;
      heartbeatIntervalMs: number | null;
    }
  | {
      type: 'invalidSubscriptionCondition';
      payload: { code: number; message: string };
    }
  | { type: 'serverRequest' }
  | { type: 'reconnect' }
  | { type: 'unhandledOp'; op: number };

/**
 * The EventAPI advertises several encodes per emote. Prefer avif at the largest
 * scale (best size/quality, and the url form the CDN expects), but fall back to
 * webp so an emote whose host only ships webp still resolves real dimensions -
 * otherwise width/height collapse to 0 and a non-square emote renders as a 1:1
 * square at the wrong width. As a last resort take the widest encode that
 * carries dimensions so the aspect ratio is at least correct.
 */
const SEVEN_TV_FILE_PREFERENCE = [
  '4x.avif',
  '3x.avif',
  '2x.avif',
  '1x.avif',
  '4x.webp',
  '3x.webp',
  '2x.webp',
  '1x.webp',
] as const;

function pickBestSevenTvFile(
  files: readonly SevenTvFile[],
): SevenTvFile | undefined {
  const byName = new Map(files.map(file => [file.name, file]));
  for (const name of SEVEN_TV_FILE_PREFERENCE) {
    const match = byName.get(name);
    if (match) {
      return match;
    }
  }
  let widest: SevenTvFile | undefined;
  for (const file of files) {
    if (
      file.width > 0 &&
      file.height > 0 &&
      (!widest || file.width > widest.width)
    ) {
      widest = file;
    }
  }
  return widest;
}

function toSanitisedSevenTvEmote(
  emote: SevenTvEmote,
  actor: StvUser | undefined,
  now: number,
): SanitisedEmote {
  const bestFile = pickBestSevenTvFile(emote.data.host.files);
  const url = `https://cdn.7tv.app/emote/${emote.id}/${bestFile?.name ?? '1x.avif'}`;

  return {
    name: emote.name,
    id: emote.id,
    url,
    image_variants: deriveEmoteImageVariantsFromUrl(url) ?? undefined,
    original_name: emote.data.name,
    creator:
      (emote.data.owner?.display_name || emote.data.owner?.username) ??
      'UNKNOWN',
    emote_link: `https://7tv.app/emotes/${emote.id}`,
    site: '7TV Channel' as const,
    frame_count: bestFile?.frame_count ?? 1,
    format: bestFile?.format ?? 'avif',
    flags: emote.data.flags,
    aspect_ratio:
      bestFile && bestFile.height > 0 ? bestFile.width / bestFile.height : 1,
    // eslint-disable-next-line no-bitwise
    zero_width: Boolean(emote.data.flags & 256),
    width: bestFile?.width ?? 0,
    height: bestFile?.height ?? 0,
    set_metadata: {
      setId: '',
      setName: '',
      capacity: null,
      ownerId: null,
      kind: EmoteSetKind.Normal,
      updatedAt: new Date(now).toISOString(),
      totalCount: 0,
    },
    actor,
  };
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

function interpretEmoteSetUpdate(
  data: SevenTvEventData<'emote_set.update'>,
  context: SeventvWsInterpreterContext,
): SeventvWsDecision {
  const receivedEmoteSetId = data.body.id;
  const { expectedEmoteSetId } = context;

  if (!receivedEmoteSetId) {
    return { type: 'ignoreEmoteSetUpdate', reason: 'inactiveEmoteSet' };
  }

  /**
   * Updates for a set other than the channel's active one are usually a
   * chatter's personal emote set; hand the set id to the caller so it can
   * refresh the matching personal set instead of dropping the event.
   */
  if (!expectedEmoteSetId || receivedEmoteSetId !== expectedEmoteSetId) {
    return {
      type: 'emoteSetUpdateForOtherSet',
      emoteSetId: receivedEmoteSetId,
    };
  }

  try {
    if (context.connectionTimestamp) {
      const timeSinceConnection = context.now - context.connectionTimestamp;

      if (timeSinceConnection < HISTORICAL_EVENT_BUFFER) {
        return { type: 'ignoreEmoteSetUpdate', reason: 'historicalEvent' };
      }
    }

    const added: SanitisedEmote[] = [];
    const removed: SanitisedEmote[] = [];
    const { body } = data;

    if (body.pushed) {
      body.pushed.forEach(emote => {
        added.push(
          toSanitisedSevenTvEmote(emote.value, body.actor, context.now),
        );
      });
    }

    if (body.pulled) {
      body.pulled.forEach(emote => {
        if (emote && emote.old_value) {
          removed.push(
            toSanitisedSevenTvEmote(emote.old_value, body.actor, context.now),
          );
        }
      });
    }

    if (body.updated) {
      body.updated.forEach(emote => {
        if (emote.old_value) {
          removed.push(
            toSanitisedSevenTvEmote(emote.old_value, body.actor, context.now),
          );
        }
        added.push(
          toSanitisedSevenTvEmote(emote.value, body.actor, context.now),
        );
      });
    }

    if (added.length === 0 && removed.length === 0) {
      return { type: 'ignoreEmoteSetUpdate', reason: 'noChanges' };
    }

    return {
      type: 'applyEmoteUpdate',
      added,
      removed,
      channelId: context.channelId || '',
    };
  } catch (error) {
    return {
      type: 'eventInterpretationFailed',
      eventType: 'emote_set.update',
      error,
    };
  }
}

function interpretCosmeticCreate(
  data: SevenTvEventData<'cosmetic.create'>,
): SeventvWsDecision {
  try {
    const cosmeticKind = data.body.object.kind;

    if (cosmeticKind === 'PAINT' || cosmeticKind === 'BADGE') {
      return {
        type: 'applyCosmeticCreate',
        cosmetic: data.body,
        kind: cosmeticKind,
      };
    }

    return { type: 'ignoreCosmeticCreate', reason: 'unsupportedKind' };
  } catch (error) {
    return {
      type: 'eventInterpretationFailed',
      eventType: 'cosmetic.create',
      error,
    };
  }
}

function interpretCosmeticUpdate(
  data: SevenTvEventData<'cosmetic.update'>,
): SeventvWsDecision {
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

    return { type: 'applyCosmeticUpdate', changes, kind };
  } catch (error) {
    return {
      type: 'eventInterpretationFailed',
      eventType: 'cosmetic.update',
      error,
    };
  }
}

function interpretCosmeticDelete(
  data: SevenTvEventData<'cosmetic.delete'>,
): SeventvWsDecision {
  try {
    return { type: 'applyCosmeticDelete', cosmeticId: data.body.id };
  } catch (error) {
    return {
      type: 'eventInterpretationFailed',
      eventType: 'cosmetic.delete',
      error,
    };
  }
}

function interpretEntitlementCreate(
  data: SevenTvEventData<'entitlement.create'>,
): SeventvWsDecision {
  try {
    const { body } = data;
    const { object } = body;
    const { kind: entitlementKind, user } = object;

    const ttvUserId = findTwitchUserId(user.connections);
    const paintId = user.style?.paint_id ?? null;
    const badgeId = user.style?.badge_id ?? null;

    return {
      type: 'applyEntitlementCreate',
      entitlement: body,
      kind: entitlementKind,
      ttvUserId,
      paintId,
      badgeId,
      userDisplayName: user.display_name,
    };
  } catch (error) {
    return {
      type: 'eventInterpretationFailed',
      eventType: 'entitlement.create',
      error,
    };
  }
}

function interpretEntitlementUpdate(
  data: SevenTvEventData<'entitlement.update'>,
): SeventvWsDecision {
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
              if (user.style?.paint_id) {
                paintId = user.style.paint_id;
              }
              if (user.style?.badge_id) {
                badgeId = user.style.badge_id;
              }
            }
          }
        }
      }
    }

    return {
      type: 'applyEntitlementUpdate',
      changes,
      ttvUserId,
      paintId,
      badgeId,
    };
  } catch (error) {
    return {
      type: 'eventInterpretationFailed',
      eventType: 'entitlement.update',
      error,
    };
  }
}

function interpretEntitlementDelete(
  data: SevenTvEventData<'entitlement.delete'>,
): SeventvWsDecision {
  try {
    return {
      type: 'applyEntitlementDelete',
      entitlementId: data.body.id,
      ttvUserId: null, // Will be resolved in the store
    };
  } catch (error) {
    return {
      type: 'eventInterpretationFailed',
      eventType: 'entitlement.delete',
      error,
    };
  }
}

function interpretEntitlementReset(
  data: SevenTvEventData<'entitlement.reset'>,
): SeventvWsDecision {
  try {
    return {
      type: 'applyEntitlementReset',
      sevenTvUserId: data.body.id,
    };
  } catch (error) {
    return {
      type: 'eventInterpretationFailed',
      eventType: 'entitlement.reset',
      error,
    };
  }
}

/**
 * A `user.update` for the channel owner carries the active emote set switch
 * as a nested change: `updated[key=connections].value[key=emote_set]` with
 * `{id, name}` old/new values. Anything else on the user object is ignored.
 */
function interpretUserUpdate(
  data: SevenTvEventData<'user.update'>,
  context: SeventvWsInterpreterContext,
): SeventvWsDecision {
  try {
    // Same replay guard as emote_set.update: dispatches replayed right after
    // a reconnect/RESUME describe switches that already happened.
    if (context.connectionTimestamp) {
      const timeSinceConnection = context.now - context.connectionTimestamp;

      if (timeSinceConnection < HISTORICAL_EVENT_BUFFER) {
        return { type: 'ignoreUserUpdate', reason: 'historicalEvent' };
      }
    }

    const updated = data.body.updated ?? [];
    for (const entry of updated) {
      if (entry.key !== 'connections' || !Array.isArray(entry.value)) {
        continue;
      }
      for (const nested of entry.value) {
        if (nested.key !== 'emote_set') {
          continue;
        }
        const newSet = nested.value as { id?: string; name?: string } | null;
        const oldSet = nested.old_value as { id?: string } | null;
        if (newSet?.id && newSet.id !== oldSet?.id) {
          return {
            type: 'applyEmoteSetSwitch',
            oldSetId: oldSet?.id ?? null,
            newSetId: newSet.id,
            newSetName: newSet.name ?? null,
          };
        }
      }
    }
    return { type: 'ignoreUserUpdate', reason: 'noEmoteSetChange' };
  } catch (error) {
    return {
      type: 'eventInterpretationFailed',
      eventType: 'user.update',
      error,
    };
  }
}

function interpretDispatchEvent(
  data: SevenTvEventData<SevenTvEventType>,
  context: SeventvWsInterpreterContext,
): SeventvWsDecision {
  switch (data.type) {
    case 'emote_set.update':
      return interpretEmoteSetUpdate(
        data as SevenTvEventData<'emote_set.update'>,
        context,
      );

    case 'cosmetic.create':
      return interpretCosmeticCreate(
        data as SevenTvEventData<'cosmetic.create'>,
      );

    case 'entitlement.create':
      return interpretEntitlementCreate(
        data as SevenTvEventData<'entitlement.create'>,
      );

    case 'cosmetic.update':
      return interpretCosmeticUpdate(
        data as SevenTvEventData<'cosmetic.update'>,
      );

    case 'cosmetic.delete':
      return interpretCosmeticDelete(
        data as SevenTvEventData<'cosmetic.delete'>,
      );

    case 'entitlement.update':
      return interpretEntitlementUpdate(
        data as SevenTvEventData<'entitlement.update'>,
      );

    case 'entitlement.delete':
      return interpretEntitlementDelete(
        data as SevenTvEventData<'entitlement.delete'>,
      );

    case 'entitlement.reset':
      return interpretEntitlementReset(
        data as SevenTvEventData<'entitlement.reset'>,
      );

    case 'user.update':
      return interpretUserUpdate(
        data as SevenTvEventData<'user.update'>,
        context,
      );

    default:
      return { type: 'unhandledEventType', eventType: data.type };
  }
}

function interpretDispatch(
  data: SevenTvEventData<SevenTvEventType>,
  context: SeventvWsInterpreterContext,
): SeventvWsDecision[] {
  if (!data) {
    return [{ type: 'ignoreDispatch', reason: 'missingEventData' }];
  }

  if (typeof data !== 'object' || !('type' in data)) {
    return [{ type: 'ignoreDispatch', reason: 'malformedEventData' }];
  }

  return [
    interpretDispatchEvent(data, context),
    { type: 'notifyEvent', eventType: data.type, data },
  ];
}

export function interpretSeventvWsMessage(
  message: SevenTvWsMessage<SevenTvEventData<SevenTvEventType>>,
  context: SeventvWsInterpreterContext,
): SeventvWsDecision[] {
  switch (message.op) {
    case 0:
      return interpretDispatch(message.d, context);

    case 2:
      return [{ type: 'heartbeat', count: message.d.count }];

    case 5: {
      if (message.d.command === 'RESUME') {
        const resumeData = message.d.data as {
          success?: boolean;
          dispatches_replayed?: number;
          subscriptions_restored?: number;
        } | null;
        return [
          {
            type: 'resumeAck',
            success: resumeData?.success === true,
            dispatchesReplayed: resumeData?.dispatches_replayed ?? 0,
            subscriptionsRestored: resumeData?.subscriptions_restored ?? 0,
          },
        ];
      }
      return [{ type: 'ack', command: message.d.command }];
    }

    case 1:
      return [
        {
          type: 'hello',
          sessionId: message.d?.session_id ?? null,
          heartbeatIntervalMs: message.d?.heartbeat_interval ?? null,
        },
      ];

    case 6:
      return [{ type: 'invalidSubscriptionCondition', payload: message.d }];

    case 7:
      return [{ type: 'serverRequest' }];

    case 4:
      return [{ type: 'reconnect' }];

    default:
      return [{ type: 'unhandledOp', op: message.op }];
  }
}

export function buildResumeMessage(sessionId: string): SevenTvWsMessage<never> {
  return {
    op: 34,
    d: {
      session_id: sessionId,
    },
  };
}

export function buildEntitlementCreateSubscribeMessage(
  channelId: string,
  t: number,
): SevenTvWsMessage<never, 'entitlement.create'> {
  return {
    op: 35,
    t,
    d: {
      type: 'entitlement.create',
      condition: {
        platform: 'TWITCH',
        ctx: 'channel',
        id: channelId,
      },
    },
  };
}

export function buildCosmeticCreateSubscribeMessage(
  channelId: string,
  t: number,
): SevenTvWsMessage<never, 'cosmetic.create'> {
  return {
    op: 35,
    t,
    d: {
      type: 'cosmetic.create',
      condition: {
        platform: 'TWITCH',
        ctx: 'channel',
        id: channelId,
      },
    },
  };
}

export function buildEmoteSetUpdateSubscribeMessage(
  emoteSetId: string,
  t?: number,
): SevenTvWsMessage<never, 'emote_set.update'> {
  if (t !== undefined) {
    return {
      op: 35,
      t,
      d: {
        type: 'emote_set.update',
        condition: {
          object_id: emoteSetId,
        },
      },
    };
  }

  return {
    op: 35,
    d: {
      type: 'emote_set.update',
      condition: {
        object_id: emoteSetId,
      },
    },
  };
}

export function buildEmoteSetUpdateUnsubscribeMessage(
  emoteSetId: string,
): SevenTvWsMessage<never, 'emote_set.update'> {
  return {
    op: 36,
    d: {
      type: 'emote_set.update',
      condition: {
        object_id: emoteSetId,
      },
    },
  };
}

export function buildEntitlementCreateUnsubscribeMessage(
  channelId: string,
): SevenTvWsMessage<never, 'entitlement.create'> {
  return {
    op: 36,
    d: {
      type: 'entitlement.create',
      condition: {
        platform: 'TWITCH',
        ctx: 'channel',
        id: channelId,
      },
    },
  };
}

export function buildCosmeticCreateUnsubscribeMessage(
  channelId: string,
): SevenTvWsMessage<never, 'cosmetic.create'> {
  return {
    op: 36,
    d: {
      type: 'cosmetic.create',
      condition: {
        platform: 'TWITCH',
        ctx: 'channel',
        id: channelId,
      },
    },
  };
}

export function buildUserUpdateSubscribeMessage(
  sevenTvUserId: string,
): SevenTvWsMessage<never, 'user.update'> {
  return {
    op: 35,
    d: {
      type: 'user.update',
      condition: {
        object_id: sevenTvUserId,
      },
    },
  };
}

export function buildUserUpdateUnsubscribeMessage(
  sevenTvUserId: string,
): SevenTvWsMessage<never, 'user.update'> {
  return {
    op: 36,
    d: {
      type: 'user.update',
      condition: {
        object_id: sevenTvUserId,
      },
    },
  };
}
