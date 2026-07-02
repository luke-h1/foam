import type { SevenTvEventData } from '@app/types/seventv/cosmetics';

import {
  type CosmeticSyncDeps,
  handleCosmeticCreate,
  handleCosmeticDelete,
  handleCosmeticUpdate,
  handleEntitlementCreate,
  handleEntitlementDelete,
  handleEntitlementUpdate,
} from '../cosmeticSync';
import {
  createBadgeCosmetic,
  createCosmeticChangeEntry,
  createCosmeticPushedEntry,
  createCosmeticUpdateEvent,
  createEntitlementChangeEntry,
  createEntitlementCreate,
  createEntitlementCreateEvent,
  createEntitlementUpdateEvent,
  createEntitlementUser,
  createPaintCosmetic,
} from './__fixtures__/cosmeticSync.fixture';

jest.mock('@app/utils/logger', () => ({
  logger: {
    chat: {
      debug: jest.fn(),
      error: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
    },
    stvWs: {
      debug: jest.fn(),
      error: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
    },
  },
}));

function createDeps(
  overrides: Partial<CosmeticSyncDeps> = {},
): CosmeticSyncDeps {
  return {
    onCosmeticCreate: jest.fn(),
    onCosmeticUpdate: jest.fn(),
    onCosmeticDelete: jest.fn(),
    onEntitlementCreate: jest.fn(),
    onEntitlementUpdate: jest.fn(),
    onEntitlementDelete: jest.fn(),
    ...overrides,
  };
}

describe('handleEntitlementCreate', () => {
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
    const onEntitlementCreate = jest.fn();
    const deps = createDeps({ onEntitlementCreate });

    handleEntitlementCreate(event, deps);

    expect(onEntitlementCreate).toHaveBeenCalledTimes(1);
    expect(onEntitlementCreate.mock.calls[0]?.[0]).toEqual({
      entitlement: createEntitlementCreate({
        kind: 'PAINT',
        refId: 'paint-1',
        user,
      }),
      kind: 'PAINT',
      ttvUserId: 'ttv-123',
      paintId: 'paint-1',
      badgeId: null,
    });
  });

  test('reports null ids when the user has no twitch connection or style', () => {
    const user = createEntitlementUser();
    const event = createEntitlementCreateEvent({
      kind: 'BADGE',
      refId: 'badge-1',
      user,
    });
    const onEntitlementCreate = jest.fn();
    const deps = createDeps({ onEntitlementCreate });

    handleEntitlementCreate(event, deps);

    expect(onEntitlementCreate).toHaveBeenCalledTimes(1);
    expect(onEntitlementCreate.mock.calls[0]?.[0]).toEqual({
      entitlement: createEntitlementCreate({
        kind: 'BADGE',
        refId: 'badge-1',
        user,
      }),
      kind: 'BADGE',
      ttvUserId: null,
      paintId: null,
      badgeId: null,
    });
  });
});

describe('handleCosmeticCreate', () => {
  test('forwards badge cosmetics with their kind', () => {
    const badge = createBadgeCosmetic({ id: 'badge-1', name: 'Sub Badge' });
    const event: SevenTvEventData<'cosmetic.create'> = {
      type: 'cosmetic.create',
      body: badge,
    };
    const onCosmeticCreate = jest.fn();
    const deps = createDeps({ onCosmeticCreate });

    handleCosmeticCreate(event, deps);

    expect(onCosmeticCreate).toHaveBeenCalledTimes(1);
    expect(onCosmeticCreate.mock.calls[0]?.[0]).toEqual({
      cosmetic: createBadgeCosmetic({ id: 'badge-1', name: 'Sub Badge' }),
      kind: 'BADGE',
    });
  });
});

describe('handleCosmeticUpdate', () => {
  test('infers the badge kind from updated entries', () => {
    const badge = createBadgeCosmetic({ id: 'badge-1', name: 'Sub Badge' });
    const event = createCosmeticUpdateEvent({
      updated: [createCosmeticChangeEntry(badge)],
    });
    const onCosmeticUpdate = jest.fn();
    const deps = createDeps({ onCosmeticUpdate });

    handleCosmeticUpdate(event, deps);

    expect(onCosmeticUpdate).toHaveBeenCalledTimes(1);
    expect(onCosmeticUpdate.mock.calls[0]?.[0]).toEqual({
      changes: event.body,
      kind: 'BADGE',
    });
  });

  test('falls back to pushed entries when updated entries carry no cosmetic object', () => {
    const paint = createPaintCosmetic({ id: 'paint-1', name: 'Candy Cane' });
    const event = createCosmeticUpdateEvent({
      pushed: [createCosmeticPushedEntry(paint)],
    });
    const onCosmeticUpdate = jest.fn();
    const deps = createDeps({ onCosmeticUpdate });

    handleCosmeticUpdate(event, deps);

    expect(onCosmeticUpdate).toHaveBeenCalledTimes(1);
    expect(onCosmeticUpdate.mock.calls[0]?.[0]).toEqual({
      changes: event.body,
      kind: 'PAINT',
    });
  });

  test('passes a null kind when the change map has no cosmetic entries', () => {
    const event = createCosmeticUpdateEvent({});
    const onCosmeticUpdate = jest.fn();
    const deps = createDeps({ onCosmeticUpdate });

    handleCosmeticUpdate(event, deps);

    expect(onCosmeticUpdate).toHaveBeenCalledTimes(1);
    expect(onCosmeticUpdate.mock.calls[0]?.[0]).toEqual({
      changes: event.body,
      kind: null,
    });
  });
});

describe('handleCosmeticDelete', () => {
  test('forwards the deleted cosmetic id', () => {
    const event: SevenTvEventData<'cosmetic.delete'> = {
      type: 'cosmetic.delete',
      body: { id: 'cosmetic-9' },
    };
    const onCosmeticDelete = jest.fn();
    const deps = createDeps({ onCosmeticDelete });

    handleCosmeticDelete(event, deps);

    expect(onCosmeticDelete).toHaveBeenCalledTimes(1);
    expect(onCosmeticDelete.mock.calls[0]?.[0]).toEqual({
      cosmeticId: 'cosmetic-9',
    });
  });
});

describe('handleEntitlementUpdate', () => {
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
    const onEntitlementUpdate = jest.fn();
    const deps = createDeps({ onEntitlementUpdate });

    handleEntitlementUpdate(event, deps);

    expect(onEntitlementUpdate).toHaveBeenCalledTimes(1);
    expect(onEntitlementUpdate.mock.calls[0]?.[0]).toEqual({
      changes: event.body,
      ttvUserId: 'ttv-456',
      paintId: 'paint-2',
      badgeId: 'badge-2',
    });
  });

  test('reports null ids when no updated entry carries a user', () => {
    const event = createEntitlementUpdateEvent({});
    const onEntitlementUpdate = jest.fn();
    const deps = createDeps({ onEntitlementUpdate });

    handleEntitlementUpdate(event, deps);

    expect(onEntitlementUpdate).toHaveBeenCalledTimes(1);
    expect(onEntitlementUpdate.mock.calls[0]?.[0]).toEqual({
      changes: event.body,
      ttvUserId: null,
      paintId: null,
      badgeId: null,
    });
  });
});

describe('handleEntitlementDelete', () => {
  test('forwards the entitlement id with a null twitch user id', () => {
    const event: SevenTvEventData<'entitlement.delete'> = {
      type: 'entitlement.delete',
      body: { id: 'entitlement-9' },
    };
    const onEntitlementDelete = jest.fn();
    const deps = createDeps({ onEntitlementDelete });

    handleEntitlementDelete(event, deps);

    expect(onEntitlementDelete).toHaveBeenCalledTimes(1);
    expect(onEntitlementDelete.mock.calls[0]?.[0]).toEqual({
      entitlementId: 'entitlement-9',
      ttvUserId: null,
    });
  });
});
