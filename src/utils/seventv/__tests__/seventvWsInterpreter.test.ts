import { EmoteSetKind } from '@app/graphql/generated/gql';
import type {
  SevenTvEventData,
  SevenTvWsMessage,
} from '@app/types/seventv/cosmetics';

import {
  buildCosmeticCreateSubscribeMessage,
  buildEmoteSetUpdateSubscribeMessage,
  buildEmoteSetUpdateUnsubscribeMessage,
  buildEntitlementCreateSubscribeMessage,
  buildResumeMessage,
  HISTORICAL_EVENT_BUFFER,
  interpretSeventvWsMessage,
  type SeventvWsDecision,
} from '../seventvWsInterpreter';
import {
  coerceEvent,
  coerceMessage,
  createBadgeCosmetic,
  createContext,
  createCosmeticChangeEntry,
  createCosmeticPushedEntry,
  createCosmeticUpdateEvent,
  createDispatchMessage,
  createEmoteSetUpdateEvent,
  createEntitlementChangeEntry,
  createEntitlementCreate,
  createEntitlementCreateEvent,
  createEntitlementUpdateEvent,
  createEntitlementUser,
  createPaintCosmetic,
  createPulledChange,
  createPushedChange,
  createSevenTvEmote,
  createSevenTvFile,
  createStvActor,
  createUpdatedChange,
  FIXTURE_NOW,
} from './__fixtures__/seventvWsInterpreter.fixture';

describe('interpretSeventvWsMessage', () => {
  describe('emote_set.update', () => {
    test('returns the old emote as removed and the new emote as added for an in-place update', () => {
      const actor = createStvActor();
      const oldEmote = createSevenTvEmote({
        id: 'emote-1',
        name: 'OldPeepo',
        originalName: 'peepoHappy',
      });
      const newEmote = createSevenTvEmote({
        id: 'emote-1',
        name: 'NewPeepo',
        originalName: 'peepoHappy',
      });
      const event = createEmoteSetUpdateEvent({
        id: 'set-1',
        actor,
        updated: [createUpdatedChange(oldEmote, newEmote)],
      });

      const decisions = interpretSeventvWsMessage(
        createDispatchMessage(event),
        createContext({
          connectionTimestamp: FIXTURE_NOW - HISTORICAL_EVENT_BUFFER,
        }),
      );

      expect(decisions).toEqual<SeventvWsDecision[]>([
        {
          type: 'applyEmoteUpdate',
          added: [
            {
              name: 'NewPeepo',
              id: 'emote-1',
              url: 'https://cdn.7tv.app/emote/emote-1/4x.avif',
              original_name: 'peepoHappy',
              creator: 'EmoteAuthor',
              emote_link: 'https://7tv.app/emotes/emote-1',
              site: '7TV Channel',
              frame_count: 60,
              format: 'AVIF',
              flags: 0,
              aspect_ratio: 1,
              zero_width: false,
              width: 128,
              height: 128,
              set_metadata: {
                setId: '',
                setName: '',
                capacity: null,
                ownerId: null,
                kind: EmoteSetKind.Normal,
                updatedAt: '2025-06-01T12:00:00.000Z',
                totalCount: 0,
              },
              actor,
            },
          ],
          removed: [
            {
              name: 'OldPeepo',
              id: 'emote-1',
              url: 'https://cdn.7tv.app/emote/emote-1/4x.avif',
              original_name: 'peepoHappy',
              creator: 'EmoteAuthor',
              emote_link: 'https://7tv.app/emotes/emote-1',
              site: '7TV Channel',
              frame_count: 60,
              format: 'AVIF',
              flags: 0,
              aspect_ratio: 1,
              zero_width: false,
              width: 128,
              height: 128,
              set_metadata: {
                setId: '',
                setName: '',
                capacity: null,
                ownerId: null,
                kind: EmoteSetKind.Normal,
                updatedAt: '2025-06-01T12:00:00.000Z',
                totalCount: 0,
              },
              actor,
            },
          ],
          channelId: '12345',
        },
        { type: 'notifyEvent', eventType: 'emote_set.update', data: event },
      ]);
    });

    test('maps pushed emotes to added and pulled emotes to removed, picking the best available file', () => {
      const actor = createStvActor();
      const zeroWidthEmote = createSevenTvEmote({
        id: 'emote-zw',
        name: 'SoSnowy',
        flags: 256,
        files: [
          createSevenTvFile({ name: '1x.avif', width: 32, height: 32 }),
          createSevenTvFile({
            name: '2x.avif',
            width: 64,
            height: 32,
            frame_count: 12,
          }),
        ],
      });
      const removedEmote = createSevenTvEmote({
        id: 'emote-old',
        name: 'FeelsBadMan',
      });
      const event = createEmoteSetUpdateEvent({
        id: 'set-1',
        actor,
        pushed: [createPushedChange(zeroWidthEmote)],
        pulled: [createPulledChange(removedEmote)],
      });

      const decisions = interpretSeventvWsMessage(
        createDispatchMessage(event),
        createContext(),
      );

      expect(decisions).toEqual<SeventvWsDecision[]>([
        {
          type: 'applyEmoteUpdate',
          added: [
            {
              name: 'SoSnowy',
              id: 'emote-zw',
              url: 'https://cdn.7tv.app/emote/emote-zw/2x.avif',
              original_name: 'SoSnowy',
              creator: 'EmoteAuthor',
              emote_link: 'https://7tv.app/emotes/emote-zw',
              site: '7TV Channel',
              frame_count: 12,
              format: 'AVIF',
              flags: 256,
              aspect_ratio: 2,
              zero_width: true,
              width: 64,
              height: 32,
              set_metadata: {
                setId: '',
                setName: '',
                capacity: null,
                ownerId: null,
                kind: EmoteSetKind.Normal,
                updatedAt: '2025-06-01T12:00:00.000Z',
                totalCount: 0,
              },
              actor,
            },
          ],
          removed: [
            {
              name: 'FeelsBadMan',
              id: 'emote-old',
              url: 'https://cdn.7tv.app/emote/emote-old/4x.avif',
              original_name: 'FeelsBadMan',
              creator: 'EmoteAuthor',
              emote_link: 'https://7tv.app/emotes/emote-old',
              site: '7TV Channel',
              frame_count: 60,
              format: 'AVIF',
              flags: 0,
              aspect_ratio: 1,
              zero_width: false,
              width: 128,
              height: 128,
              set_metadata: {
                setId: '',
                setName: '',
                capacity: null,
                ownerId: null,
                kind: EmoteSetKind.Normal,
                updatedAt: '2025-06-01T12:00:00.000Z',
                totalCount: 0,
              },
              actor,
            },
          ],
          channelId: '12345',
        },
        { type: 'notifyEvent', eventType: 'emote_set.update', data: event },
      ]);
    });

    test('ignores updates for a different emote set but still notifies the raw event', () => {
      const event = createEmoteSetUpdateEvent({
        id: 'other-set',
        pushed: [
          createPushedChange(
            createSevenTvEmote({ id: 'emote-1', name: 'peepoHappy' }),
          ),
        ],
      });

      const decisions = interpretSeventvWsMessage(
        createDispatchMessage(event),
        createContext(),
      );

      expect(decisions).toEqual<SeventvWsDecision[]>([
        {
          type: 'emoteSetUpdateForOtherSet',
          emoteSetId: 'other-set',
        },
        { type: 'notifyEvent', eventType: 'emote_set.update', data: event },
      ]);
    });

    test('routes updates to the other-set path when no active emote set is known', () => {
      const event = createEmoteSetUpdateEvent({
        id: 'set-1',
        pushed: [
          createPushedChange(
            createSevenTvEmote({ id: 'emote-1', name: 'peepoHappy' }),
          ),
        ],
      });

      const decisions = interpretSeventvWsMessage(
        createDispatchMessage(event),
        createContext({ expectedEmoteSetId: undefined }),
      );

      expect(decisions).toEqual<SeventvWsDecision[]>([
        { type: 'emoteSetUpdateForOtherSet', emoteSetId: 'set-1' },
        { type: 'notifyEvent', eventType: 'emote_set.update', data: event },
      ]);
    });

    test('ignores updates whose body carries no emote set id', () => {
      const event = coerceEvent<'emote_set.update'>({
        type: 'emote_set.update',
        body: { kind: 2 },
      });

      const decisions = interpretSeventvWsMessage(
        createDispatchMessage(event),
        createContext(),
      );

      expect(decisions).toEqual<SeventvWsDecision[]>([
        { type: 'ignoreEmoteSetUpdate', reason: 'inactiveEmoteSet' },
        { type: 'notifyEvent', eventType: 'emote_set.update', data: event },
      ]);
    });

    test('ignores updates that arrive within the historical event buffer', () => {
      const event = createEmoteSetUpdateEvent({
        id: 'set-1',
        pushed: [
          createPushedChange(
            createSevenTvEmote({ id: 'emote-1', name: 'peepoHappy' }),
          ),
        ],
      });

      const decisions = interpretSeventvWsMessage(
        createDispatchMessage(event),
        createContext({ connectionTimestamp: FIXTURE_NOW - 5000 }),
      );

      expect(decisions).toEqual<SeventvWsDecision[]>([
        { type: 'ignoreEmoteSetUpdate', reason: 'historicalEvent' },
        { type: 'notifyEvent', eventType: 'emote_set.update', data: event },
      ]);
    });

    test('returns noChanges when the update contains no emote changes', () => {
      const event = createEmoteSetUpdateEvent({ id: 'set-1' });

      const decisions = interpretSeventvWsMessage(
        createDispatchMessage(event),
        createContext(),
      );

      expect(decisions).toEqual<SeventvWsDecision[]>([
        { type: 'ignoreEmoteSetUpdate', reason: 'noChanges' },
        { type: 'notifyEvent', eventType: 'emote_set.update', data: event },
      ]);
    });

    test('skips pulled entries without an old value', () => {
      const event = coerceEvent<'emote_set.update'>({
        type: 'emote_set.update',
        body: {
          id: 'set-1',
          kind: 2,
          pulled: [{ key: 'emotes', index: 0, old_value: null, value: null }],
        },
      });

      const decisions = interpretSeventvWsMessage(
        createDispatchMessage(event),
        createContext(),
      );

      expect(decisions).toEqual<SeventvWsDecision[]>([
        { type: 'ignoreEmoteSetUpdate', reason: 'noChanges' },
        { type: 'notifyEvent', eventType: 'emote_set.update', data: event },
      ]);
    });

    test('returns eventInterpretationFailed when an emote payload cannot be sanitised', () => {
      const event = coerceEvent<'emote_set.update'>({
        type: 'emote_set.update',
        body: {
          id: 'set-1',
          kind: 2,
          pushed: [
            {
              key: 'emotes',
              index: 0,
              old_value: null,
              value: { id: 'broken', name: 'Broken' },
            },
          ],
        },
      });

      const decisions = interpretSeventvWsMessage(
        createDispatchMessage(event),
        createContext(),
      );

      expect(decisions).toHaveLength(2);
      const [failure, notify] = decisions;
      if (failure?.type !== 'eventInterpretationFailed') {
        throw new Error(
          `expected eventInterpretationFailed, got ${failure?.type}`,
        );
      }
      expect(failure.eventType).toBe('emote_set.update');
      expect(failure.error).toBeInstanceOf(TypeError);
      expect(notify).toEqual<SeventvWsDecision>({
        type: 'notifyEvent',
        eventType: 'emote_set.update',
        data: event,
      });
    });

    test('uses an empty channel id when none is known', () => {
      const event = createEmoteSetUpdateEvent({
        id: 'set-1',
        pushed: [
          createPushedChange(
            createSevenTvEmote({ id: 'emote-1', name: 'peepoHappy' }),
          ),
        ],
      });

      const [decision] = interpretSeventvWsMessage(
        createDispatchMessage(event),
        createContext({ channelId: undefined }),
      );

      if (decision?.type !== 'applyEmoteUpdate') {
        throw new Error(`expected applyEmoteUpdate, got ${decision?.type}`);
      }
      expect(decision.channelId).toBe('');
    });
  });

  describe('cosmetic.create', () => {
    test('returns applyCosmeticCreate for a badge cosmetic', () => {
      const badge = createBadgeCosmetic({ id: 'badge-1', name: 'Sub Badge' });
      const event: SevenTvEventData<'cosmetic.create'> = {
        type: 'cosmetic.create',
        body: badge,
      };

      const decisions = interpretSeventvWsMessage(
        createDispatchMessage(event),
        createContext(),
      );

      expect(decisions).toEqual<SeventvWsDecision[]>([
        { type: 'applyCosmeticCreate', cosmetic: badge, kind: 'BADGE' },
        { type: 'notifyEvent', eventType: 'cosmetic.create', data: event },
      ]);
    });

    test('returns applyCosmeticCreate for a paint cosmetic', () => {
      const paint = createPaintCosmetic({ id: 'paint-1', name: 'Candy Cane' });
      const event: SevenTvEventData<'cosmetic.create'> = {
        type: 'cosmetic.create',
        body: paint,
      };

      const decisions = interpretSeventvWsMessage(
        createDispatchMessage(event),
        createContext(),
      );

      expect(decisions).toEqual<SeventvWsDecision[]>([
        { type: 'applyCosmeticCreate', cosmetic: paint, kind: 'PAINT' },
        { type: 'notifyEvent', eventType: 'cosmetic.create', data: event },
      ]);
    });

    test('ignores cosmetics of an unsupported kind', () => {
      const event = coerceEvent<'cosmetic.create'>({
        type: 'cosmetic.create',
        body: {
          id: 'avatar-1',
          kind: 3,
          object: { id: 'avatar-1', kind: 'AVATAR', data: {} },
        },
      });

      const decisions = interpretSeventvWsMessage(
        createDispatchMessage(event),
        createContext(),
      );

      expect(decisions).toEqual<SeventvWsDecision[]>([
        { type: 'ignoreCosmeticCreate', reason: 'unsupportedKind' },
        { type: 'notifyEvent', eventType: 'cosmetic.create', data: event },
      ]);
    });

    test('returns eventInterpretationFailed when the body has no cosmetic object', () => {
      const event = coerceEvent<'cosmetic.create'>({
        type: 'cosmetic.create',
        body: { id: 'cosmetic-1', kind: 3 },
      });

      const decisions = interpretSeventvWsMessage(
        createDispatchMessage(event),
        createContext(),
      );

      expect(decisions).toHaveLength(2);
      const [failure] = decisions;
      if (failure?.type !== 'eventInterpretationFailed') {
        throw new Error(
          `expected eventInterpretationFailed, got ${failure?.type}`,
        );
      }
      expect(failure.eventType).toBe('cosmetic.create');
      expect(failure.error).toBeInstanceOf(TypeError);
    });
  });

  describe('cosmetic.update', () => {
    test('infers the badge kind from updated entries', () => {
      const badge = createBadgeCosmetic({ id: 'badge-1', name: 'Sub Badge' });
      const event = createCosmeticUpdateEvent({
        updated: [createCosmeticChangeEntry(badge)],
      });

      const decisions = interpretSeventvWsMessage(
        createDispatchMessage(event),
        createContext(),
      );

      expect(decisions).toEqual<SeventvWsDecision[]>([
        { type: 'applyCosmeticUpdate', changes: event.body, kind: 'BADGE' },
        { type: 'notifyEvent', eventType: 'cosmetic.update', data: event },
      ]);
    });

    test('falls back to pushed entries when updated entries carry no cosmetic object', () => {
      const paint = createPaintCosmetic({ id: 'paint-1', name: 'Candy Cane' });
      const event = createCosmeticUpdateEvent({
        pushed: [createCosmeticPushedEntry(paint)],
      });

      const decisions = interpretSeventvWsMessage(
        createDispatchMessage(event),
        createContext(),
      );

      expect(decisions).toEqual<SeventvWsDecision[]>([
        { type: 'applyCosmeticUpdate', changes: event.body, kind: 'PAINT' },
        { type: 'notifyEvent', eventType: 'cosmetic.update', data: event },
      ]);
    });

    test('passes a null kind when the change map has no cosmetic entries', () => {
      const event = createCosmeticUpdateEvent({});

      const decisions = interpretSeventvWsMessage(
        createDispatchMessage(event),
        createContext(),
      );

      expect(decisions).toEqual<SeventvWsDecision[]>([
        { type: 'applyCosmeticUpdate', changes: event.body, kind: null },
        { type: 'notifyEvent', eventType: 'cosmetic.update', data: event },
      ]);
    });
  });

  describe('cosmetic.delete', () => {
    test('returns applyCosmeticDelete with the deleted cosmetic id', () => {
      const event: SevenTvEventData<'cosmetic.delete'> = {
        type: 'cosmetic.delete',
        body: { id: 'cosmetic-9' },
      };

      const decisions = interpretSeventvWsMessage(
        createDispatchMessage(event),
        createContext(),
      );

      expect(decisions).toEqual<SeventvWsDecision[]>([
        { type: 'applyCosmeticDelete', cosmeticId: 'cosmetic-9' },
        { type: 'notifyEvent', eventType: 'cosmetic.delete', data: event },
      ]);
    });
  });

  describe('entitlement.create', () => {
    test('resolves the twitch user id, paint id and badge id for a paint entitlement', () => {
      const user = createEntitlementUser({
        ttvConnectionId: 'ttv-123',
        paintId: 'paint-1',
      });
      const event = createEntitlementCreateEvent({
        kind: 'PAINT',
        refId: 'paint-1',
        user,
      });

      const decisions = interpretSeventvWsMessage(
        createDispatchMessage(event),
        createContext(),
      );

      expect(decisions).toEqual<SeventvWsDecision[]>([
        {
          type: 'applyEntitlementCreate',
          entitlement: createEntitlementCreate({
            kind: 'PAINT',
            refId: 'paint-1',
            user,
          }),
          kind: 'PAINT',
          ttvUserId: 'ttv-123',
          paintId: 'paint-1',
          badgeId: null,
          userDisplayName: 'Chatter',
        },
        { type: 'notifyEvent', eventType: 'entitlement.create', data: event },
      ]);
    });

    test('reports null ids when the user has no twitch connection or style', () => {
      const user = createEntitlementUser();
      const event = createEntitlementCreateEvent({
        kind: 'BADGE',
        refId: 'badge-1',
        user,
      });

      const decisions = interpretSeventvWsMessage(
        createDispatchMessage(event),
        createContext(),
      );

      expect(decisions).toEqual<SeventvWsDecision[]>([
        {
          type: 'applyEntitlementCreate',
          entitlement: createEntitlementCreate({
            kind: 'BADGE',
            refId: 'badge-1',
            user,
          }),
          kind: 'BADGE',
          ttvUserId: null,
          paintId: null,
          badgeId: null,
          userDisplayName: 'Chatter',
        },
        { type: 'notifyEvent', eventType: 'entitlement.create', data: event },
      ]);
    });

    test('returns eventInterpretationFailed when the body has no entitlement object', () => {
      const event = coerceEvent<'entitlement.create'>({
        type: 'entitlement.create',
        body: { id: 'entitlement-1', kind: 4 },
      });

      const decisions = interpretSeventvWsMessage(
        createDispatchMessage(event),
        createContext(),
      );

      expect(decisions).toHaveLength(2);
      const [failure] = decisions;
      if (failure?.type !== 'eventInterpretationFailed') {
        throw new Error(
          `expected eventInterpretationFailed, got ${failure?.type}`,
        );
      }
      expect(failure.eventType).toBe('entitlement.create');
      expect(failure.error).toBeInstanceOf(TypeError);
    });
  });

  describe('entitlement.update', () => {
    test('extracts the twitch user id, paint id and badge id from updated entries', () => {
      const user = createEntitlementUser({
        ttvConnectionId: 'ttv-456',
        paintId: 'paint-2',
        badgeId: 'badge-2',
      });
      const entitlement = createEntitlementCreate({
        kind: 'PAINT',
        refId: 'paint-2',
        user,
      });
      const event = createEntitlementUpdateEvent({
        updated: [createEntitlementChangeEntry(entitlement)],
      });

      const decisions = interpretSeventvWsMessage(
        createDispatchMessage(event),
        createContext(),
      );

      expect(decisions).toEqual<SeventvWsDecision[]>([
        {
          type: 'applyEntitlementUpdate',
          changes: event.body,
          ttvUserId: 'ttv-456',
          paintId: 'paint-2',
          badgeId: 'badge-2',
        },
        { type: 'notifyEvent', eventType: 'entitlement.update', data: event },
      ]);
    });

    test('reports null ids when no updated entry carries a user', () => {
      const event = createEntitlementUpdateEvent({});

      const decisions = interpretSeventvWsMessage(
        createDispatchMessage(event),
        createContext(),
      );

      expect(decisions).toEqual<SeventvWsDecision[]>([
        {
          type: 'applyEntitlementUpdate',
          changes: event.body,
          ttvUserId: null,
          paintId: null,
          badgeId: null,
        },
        { type: 'notifyEvent', eventType: 'entitlement.update', data: event },
      ]);
    });
  });

  describe('entitlement.delete', () => {
    test('returns applyEntitlementDelete with the entitlement id and a null twitch user id', () => {
      const event: SevenTvEventData<'entitlement.delete'> = {
        type: 'entitlement.delete',
        body: { id: 'entitlement-9' },
      };

      const decisions = interpretSeventvWsMessage(
        createDispatchMessage(event),
        createContext(),
      );

      expect(decisions).toEqual<SeventvWsDecision[]>([
        {
          type: 'applyEntitlementDelete',
          entitlementId: 'entitlement-9',
          ttvUserId: null,
        },
        { type: 'notifyEvent', eventType: 'entitlement.delete', data: event },
      ]);
    });
  });

  describe('dispatch validation', () => {
    test('ignores a dispatch with a null payload and does not notify', () => {
      const decisions = interpretSeventvWsMessage(
        coerceMessage({ op: 0, d: null }),
        createContext(),
      );

      expect(decisions).toEqual<SeventvWsDecision[]>([
        { type: 'ignoreDispatch', reason: 'missingEventData' },
      ]);
    });

    test('ignores a dispatch whose payload is not an object', () => {
      const decisions = interpretSeventvWsMessage(
        coerceMessage({ op: 0, d: 'nonsense' }),
        createContext(),
      );

      expect(decisions).toEqual<SeventvWsDecision[]>([
        { type: 'ignoreDispatch', reason: 'malformedEventData' },
      ]);
    });

    test('ignores a dispatch whose payload has no type field', () => {
      const decisions = interpretSeventvWsMessage(
        coerceMessage({ op: 0, d: { body: { id: 'set-1' } } }),
        createContext(),
      );

      expect(decisions).toEqual<SeventvWsDecision[]>([
        { type: 'ignoreDispatch', reason: 'malformedEventData' },
      ]);
    });

    test('flags unhandled event types but still notifies the raw event', () => {
      const event = coerceEvent<'emote_set.create'>({
        type: 'emote_set.create',
        body: { id: 'set-2', name: 'New Set' },
      });

      const decisions = interpretSeventvWsMessage(
        createDispatchMessage(event),
        createContext(),
      );

      expect(decisions).toEqual<SeventvWsDecision[]>([
        { type: 'unhandledEventType', eventType: 'emote_set.create' },
        { type: 'notifyEvent', eventType: 'emote_set.create', data: event },
      ]);
    });
  });

  describe('other op codes', () => {
    test('interprets a heartbeat message', () => {
      const decisions = interpretSeventvWsMessage(
        coerceMessage({ op: 2, d: { count: 42 }, t: FIXTURE_NOW, s: 1 }),
        createContext(),
      );

      expect(decisions).toEqual<SeventvWsDecision[]>([
        { type: 'heartbeat', count: 42 },
      ]);
    });

    test('interprets a user.update emote set switch', () => {
      const event = coerceEvent<'user.update'>({
        type: 'user.update',
        body: {
          id: 'stv-owner-1',
          kind: 1,
          updated: [
            {
              key: 'connections',
              index: 0,
              old_value: null,
              value: [
                {
                  key: 'emote_set',
                  index: 0,
                  old_value: { id: 'set-old', name: 'Old Set' },
                  value: { id: 'set-new', name: 'New Set' },
                },
              ],
            },
          ],
        },
      });

      const decisions = interpretSeventvWsMessage(
        createDispatchMessage(event),
        createContext(),
      );

      expect(decisions).toEqual<SeventvWsDecision[]>([
        {
          type: 'applyEmoteSetSwitch',
          oldSetId: 'set-old',
          newSetId: 'set-new',
          newSetName: 'New Set',
        },
        { type: 'notifyEvent', eventType: 'user.update', data: event },
      ]);
    });

    test('ignores user.update events without an emote set change', () => {
      const event = coerceEvent<'user.update'>({
        type: 'user.update',
        body: {
          id: 'stv-owner-1',
          kind: 1,
          updated: [
            {
              key: 'style',
              index: 0,
              old_value: null,
              value: [],
            },
          ],
        },
      });

      const decisions = interpretSeventvWsMessage(
        createDispatchMessage(event),
        createContext(),
      );

      expect(decisions).toEqual<SeventvWsDecision[]>([
        { type: 'ignoreUserUpdate', reason: 'noEmoteSetChange' },
        { type: 'notifyEvent', eventType: 'user.update', data: event },
      ]);
    });

    test('interprets an ack message', () => {
      const decisions = interpretSeventvWsMessage(
        coerceMessage({
          op: 5,
          d: { command: 'SUBSCRIBE', data: '{}' },
          t: FIXTURE_NOW,
          s: 2,
        }),
        createContext(),
      );

      expect(decisions).toEqual<SeventvWsDecision[]>([
        { type: 'ack', command: 'SUBSCRIBE' },
      ]);
    });

    test('interprets a hello message', () => {
      const decisions = interpretSeventvWsMessage(
        coerceMessage({ op: 1 }),
        createContext(),
      );

      expect(decisions).toEqual<SeventvWsDecision[]>([
        { type: 'hello', sessionId: null, heartbeatIntervalMs: null },
      ]);
    });

    test('carries the session id from a hello payload', () => {
      const decisions = interpretSeventvWsMessage(
        coerceMessage({
          op: 1,
          d: {
            heartbeat_interval: 25000,
            session_id: 'session-1',
            subscription_limit: 500,
            instance: { name: 'event-api-1', population: 1 },
          },
        }),
        createContext(),
      );

      expect(decisions).toEqual<SeventvWsDecision[]>([
        {
          type: 'hello',
          sessionId: 'session-1',
          heartbeatIntervalMs: 25000,
        },
      ]);
    });

    test('interprets a RESUME ack with its replay counts', () => {
      const decisions = interpretSeventvWsMessage(
        coerceMessage({
          op: 5,
          d: {
            command: 'RESUME',
            data: {
              success: true,
              dispatches_replayed: 4,
              subscriptions_restored: 3,
            },
          },
          t: FIXTURE_NOW,
          s: 2,
        }),
        createContext(),
      );

      expect(decisions).toEqual<SeventvWsDecision[]>([
        {
          type: 'resumeAck',
          success: true,
          dispatchesReplayed: 4,
          subscriptionsRestored: 3,
        },
      ]);
    });

    test('interprets a failed RESUME ack', () => {
      const decisions = interpretSeventvWsMessage(
        coerceMessage({
          op: 5,
          d: { command: 'RESUME', data: { success: false } },
          t: FIXTURE_NOW,
          s: 2,
        }),
        createContext(),
      );

      expect(decisions).toEqual<SeventvWsDecision[]>([
        {
          type: 'resumeAck',
          success: false,
          dispatchesReplayed: 0,
          subscriptionsRestored: 0,
        },
      ]);
    });

    test('interprets an invalid subscription condition message', () => {
      const decisions = interpretSeventvWsMessage(
        coerceMessage({
          op: 6,
          d: { code: 4001, message: 'bad condition' },
          t: FIXTURE_NOW,
          s: 3,
        }),
        createContext(),
      );

      expect(decisions).toEqual<SeventvWsDecision[]>([
        {
          type: 'invalidSubscriptionCondition',
          payload: { code: 4001, message: 'bad condition' },
        },
      ]);
    });

    test('interprets a server request message', () => {
      const decisions = interpretSeventvWsMessage(
        coerceMessage({ op: 7 }),
        createContext(),
      );

      expect(decisions).toEqual<SeventvWsDecision[]>([
        { type: 'serverRequest' },
      ]);
    });

    test('returns reconnect decision for op 4', () => {
      const decisions = interpretSeventvWsMessage(
        coerceMessage({ op: 4 }),
        createContext(),
      );

      expect(decisions).toEqual<SeventvWsDecision[]>([{ type: 'reconnect' }]);
    });
  });
});

describe('subscription payload builders', () => {
  test('builds a resume message', () => {
    expect(buildResumeMessage('session-1')).toEqual<SevenTvWsMessage<never>>({
      op: 34,
      d: {
        session_id: 'session-1',
      },
    });
  });

  test('builds an entitlement.create subscribe message', () => {
    expect(
      buildEntitlementCreateSubscribeMessage('12345', FIXTURE_NOW),
    ).toEqual<SevenTvWsMessage<never, 'entitlement.create'>>({
      op: 35,
      t: FIXTURE_NOW,
      d: {
        type: 'entitlement.create',
        condition: {
          platform: 'TWITCH',
          ctx: 'channel',
          id: '12345',
        },
      },
    });
  });

  test('builds a cosmetic.create subscribe message', () => {
    expect(buildCosmeticCreateSubscribeMessage('12345', FIXTURE_NOW)).toEqual<
      SevenTvWsMessage<never, 'cosmetic.create'>
    >({
      op: 35,
      t: FIXTURE_NOW,
      d: {
        type: 'cosmetic.create',
        condition: {
          platform: 'TWITCH',
          ctx: 'channel',
          id: '12345',
        },
      },
    });
  });

  test('builds an emote_set.update subscribe message with a timestamp', () => {
    expect(buildEmoteSetUpdateSubscribeMessage('set-1', FIXTURE_NOW)).toEqual<
      SevenTvWsMessage<never, 'emote_set.update'>
    >({
      op: 35,
      t: FIXTURE_NOW,
      d: {
        type: 'emote_set.update',
        condition: {
          object_id: 'set-1',
        },
      },
    });
  });

  test('builds an emote_set.update subscribe message without a timestamp', () => {
    const message = buildEmoteSetUpdateSubscribeMessage('set-1');

    expect(message).toEqual<SevenTvWsMessage<never, 'emote_set.update'>>({
      op: 35,
      d: {
        type: 'emote_set.update',
        condition: {
          object_id: 'set-1',
        },
      },
    });
    expect('t' in message).toBe(false);
  });

  test('builds an emote_set.update unsubscribe message', () => {
    expect(buildEmoteSetUpdateUnsubscribeMessage('set-1')).toEqual<
      SevenTvWsMessage<never, 'emote_set.update'>
    >({
      op: 36,
      d: {
        type: 'emote_set.update',
        condition: {
          object_id: 'set-1',
        },
      },
    });
  });
});
