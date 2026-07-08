import {
  fetchUserCosmeticsByTwitchId,
  getBadge,
  getPaint,
  setUserBadge,
  setUserPaint,
} from '@app/store/chat/actions/cosmetics';
import { applyEntitlementCreateEvent } from '@app/store/chat/actions/cosmeticsBridge';
import type { EntitlementCreate } from '@app/types/seventv/cosmetics';

jest.mock('@app/store/chat/actions/cosmetics', () => ({
  addBadge: jest.fn(),
  addPaint: jest.fn(),
  fetchUserCosmeticsByTwitchId: jest.fn(() => Promise.resolve()),
  getBadge: jest.fn(),
  getPaint: jest.fn(),
  setUserBadge: jest.fn(),
  setUserPaint: jest.fn(),
}));

jest.mock('@app/store/chat/actions/personalEmotes', () => ({
  handlePersonalEmoteSetEntitlement: jest.fn(),
}));

jest.mock('@app/store/chat/observables/chatStore', () => ({
  chatStore$: {
    currentChannelId: { peek: jest.fn(() => 'channel-1') },
  },
}));

jest.mock('@app/utils/logger', () => ({
  logger: {
    stv: { warn: jest.fn() },
    stvWs: { info: jest.fn(), debug: jest.fn(), warn: jest.fn() },
  },
}));

const mockFetchUserCosmeticsByTwitchId = jest.mocked(
  fetchUserCosmeticsByTwitchId,
);
const mockGetBadge = jest.mocked(getBadge);
const mockGetPaint = jest.mocked(getPaint);
const mockSetUserBadge = jest.mocked(setUserBadge);
const mockSetUserPaint = jest.mocked(setUserPaint);

function createBadgeEntitlement(
  badgeId: string,
  ttvUserId: string,
): EntitlementCreate {
  return {
    id: `entitlement-${badgeId}`,
    kind: 0,
    object: {
      id: `entitlement-${badgeId}`,
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

describe('applyEntitlementCreateEvent', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetBadge.mockReturnValue(undefined);
    mockGetPaint.mockReturnValue(undefined);
  });

  test('binds the badge and fetches cosmetics over v4 GQL when the definition is missing', () => {
    applyEntitlementCreateEvent(
      {
        entitlement: createBadgeEntitlement('badge-1', 'ttv-1'),
        kind: 'BADGE',
        ttvUserId: 'ttv-1',
        paintId: null,
        badgeId: 'badge-1',
      },
      { requestMissingDefinitions: true },
    );

    expect(mockSetUserBadge.mock.calls).toEqual([['ttv-1', 'badge-1']]);
    expect(mockFetchUserCosmeticsByTwitchId.mock.calls).toEqual([['ttv-1']]);
  });

  test('does not fetch when the badge definition is already loaded', () => {
    mockGetBadge.mockReturnValue({
      id: 'badge-1',
      provider: '7tv',
      set: 'badge-1',
      title: 'Badge',
      type: '7TV Badge',
      url: 'https://cdn.7tv.app/badge/badge-1/4x.webp',
    });

    applyEntitlementCreateEvent(
      {
        entitlement: createBadgeEntitlement('badge-1', 'ttv-1'),
        kind: 'BADGE',
        ttvUserId: 'ttv-1',
        paintId: null,
        badgeId: 'badge-1',
      },
      { requestMissingDefinitions: true },
    );

    expect(mockSetUserBadge.mock.calls).toEqual([['ttv-1', 'badge-1']]);
    expect(mockFetchUserCosmeticsByTwitchId).not.toHaveBeenCalled();
  });

  test('never fetches when requestMissingDefinitions is false', () => {
    applyEntitlementCreateEvent(
      {
        entitlement: createBadgeEntitlement('badge-1', 'ttv-1'),
        kind: 'BADGE',
        ttvUserId: 'ttv-1',
        paintId: null,
        badgeId: 'badge-1',
      },
      { requestMissingDefinitions: false },
    );

    expect(mockSetUserBadge.mock.calls).toEqual([['ttv-1', 'badge-1']]);
    expect(mockFetchUserCosmeticsByTwitchId).not.toHaveBeenCalled();
  });

  test('binds paints and fetches missing paint definitions over v4 GQL', () => {
    const entitlement: EntitlementCreate = {
      id: 'entitlement-paint-1',
      kind: 0,
      object: {
        id: 'entitlement-paint-1',
        kind: 'PAINT',
        ref_id: 'paint-1',
        user: createBadgeEntitlement('badge-1', 'ttv-1').object.user,
      },
    };

    applyEntitlementCreateEvent(
      {
        entitlement,
        kind: 'PAINT',
        ttvUserId: 'ttv-1',
        paintId: 'paint-1',
        badgeId: null,
      },
      { requestMissingDefinitions: true },
    );

    expect(mockSetUserPaint.mock.calls).toEqual([['ttv-1', 'paint-1']]);
    expect(mockFetchUserCosmeticsByTwitchId.mock.calls).toEqual([['ttv-1']]);
  });
});
