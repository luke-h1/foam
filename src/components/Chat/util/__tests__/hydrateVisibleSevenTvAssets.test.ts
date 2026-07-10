import { EmoteSetKind } from '@app/graphql/generated/gql';
import { createUserStateTags } from '@app/types/chat/irc-tags/__fixtures__/userStateTags.fixture';
import type { SanitisedEmote } from '@app/types/emote';
import type { SanitisedBadgeSet } from '@app/types/twitch/badge';
import { createTextPart } from '@app/utils/chat/__tests__/__fixtures__/parsedPart.fixture';

import { hydrateVisibleSevenTvAssets } from '../hydrateVisibleSevenTvAssets';
import type { AnyChatMessageType } from '../messageHandlers';

const sevenTvPersonalEmote: SanitisedEmote = {
  id: 'personal-emote',
  name: 'Personal',
  original_name: 'Personal',
  creator: null,
  emote_link: 'https://7tv.app/emotes/personal-emote',
  site: '7TV Personal',
  url: 'https://cdn.7tv.app/emote/personal-emote/4x.webp',
  frame_count: 1,
  format: 'webp',
  flags: 0,
  aspect_ratio: 1,
  zero_width: false,
  width: 32,
  height: 32,
  set_metadata: {
    setId: 'personal-set',
    setName: 'Personal',
    capacity: null,
    ownerId: 'seven-tv-user',
    kind: EmoteSetKind.Personal,
    updatedAt: '2026-05-11T00:00:00.000Z',
    totalCount: 1,
  },
};

const sevenTvBadge: SanitisedBadgeSet = {
  id: 'seven-tv-badge',
  provider: '7tv',
  set: 'seven-tv-badge',
  title: '7TV Badge',
  type: '7TV Badge',
  url: 'https://cdn.7tv.app/badge/seven-tv-badge/4x.webp',
};

function createMessage(): AnyChatMessageType {
  return {
    id: 'message-1_nonce-1',
    message_id: 'message-1',
    message_nonce: 'nonce-1',
    message: [createTextPart('Personal')],
    badges: [],
    channel: 'channel',
    parentDisplayName: '',
    replyBody: '',
    replyDisplayName: '',
    sender: 'Sender',
    timestamp: '00:00',
    userstate: createUserStateTags({
      'display-name': 'Sender',
      'user-id': 'twitch-user',
      login: 'sender',
      username: 'Sender',
    }),
  };
}

function createMessageForUser(userId: string): AnyChatMessageType {
  const message = createMessage();
  return {
    ...message,
    id: `message-${userId}_nonce-${userId}`,
    message_id: `message-${userId}`,
    message_nonce: `nonce-${userId}`,
    sender: `Sender${userId}`,
    userstate: {
      ...message.userstate,
      'user-id': userId,
      login: `sender-${userId}`,
      username: `Sender${userId}`,
    },
  };
}

describe('hydrateVisibleSevenTvAssets', () => {
  test('fetches personal emotes on visible cache miss and reprocesses once image data resolves', async () => {
    const message = createMessage();
    const reprocessMessage = jest.fn();
    const fetchUserPersonalEmotes = jest
      .fn()
      .mockResolvedValue([sevenTvPersonalEmote]);

    const didReprocess = await hydrateVisibleSevenTvAssets({
      channelId: 'channel-id',
      messages: [message],
      hydratedMessageKeys: new Set(),
      personalEmoteUsers: new Set(),
      cosmeticUsers: new Set(['twitch-user']),
      getUserPersonalEmotes: jest.fn(() => []),
      fetchUserPersonalEmotes,
      getUserBadge: jest.fn(() => null),
      fetchUserCosmetics: jest.fn(),
      reprocessMessage,
    });

    expect(fetchUserPersonalEmotes).toHaveBeenCalledWith(
      'twitch-user',
      'channel-id',
    );
    expect(reprocessMessage).toHaveBeenCalledWith(message);
    expect(didReprocess).toBe(true);
  });

  test('keeps the per-user guard when a personal emote lookup fails so a busy channel does not refetch every pass', async () => {
    const message = createMessage();
    const personalEmoteUsers = new Set<string>();
    const fetchUserPersonalEmotes = jest.fn().mockResolvedValue(null);

    await hydrateVisibleSevenTvAssets({
      channelId: 'channel-id',
      messages: [message],
      hydratedMessageKeys: new Set(),
      personalEmoteUsers,
      cosmeticUsers: new Set(['twitch-user']),
      getUserPersonalEmotes: jest.fn(() => []),
      fetchUserPersonalEmotes,
      getUserBadge: jest.fn(() => null),
      fetchUserCosmetics: jest.fn(),
      reprocessMessage: jest.fn(),
    });

    expect(fetchUserPersonalEmotes).toHaveBeenCalledTimes(1);
    expect(personalEmoteUsers.has('twitch-user')).toBe(true);
  });

  test('keeps the per-user guard when a user genuinely has no personal emotes', async () => {
    const message = createMessage();
    const personalEmoteUsers = new Set<string>();
    const fetchUserPersonalEmotes = jest.fn().mockResolvedValue([]);

    await hydrateVisibleSevenTvAssets({
      channelId: 'channel-id',
      messages: [message],
      hydratedMessageKeys: new Set(),
      personalEmoteUsers,
      cosmeticUsers: new Set(['twitch-user']),
      getUserPersonalEmotes: jest.fn(() => []),
      fetchUserPersonalEmotes,
      getUserBadge: jest.fn(() => null),
      fetchUserCosmetics: jest.fn(),
      reprocessMessage: jest.fn(),
    });

    expect(fetchUserPersonalEmotes).toHaveBeenCalledTimes(1);
    expect(personalEmoteUsers.has('twitch-user')).toBe(true);
  });

  test('limits visible-user personal emote fetches per hydration pass', async () => {
    const fetchUserPersonalEmotes = jest.fn().mockResolvedValue([]);

    const didReprocess = await hydrateVisibleSevenTvAssets({
      channelId: 'channel-id',
      messages: ['1', '2', '3', '4', '5'].map(createMessageForUser),
      hydratedMessageKeys: new Set(),
      personalEmoteUsers: new Set(),
      cosmeticUsers: new Set(['1', '2', '3', '4', '5']),
      getUserPersonalEmotes: jest.fn(() => []),
      fetchUserPersonalEmotes,
      getUserBadge: jest.fn(() => null),
      fetchUserCosmetics: jest.fn(),
      reprocessMessage: jest.fn(),
    });

    expect(fetchUserPersonalEmotes).toHaveBeenCalledTimes(3);
    expect(didReprocess).toBe(false);
  });

  test('does not fetch or reprocess 7TV personal emotes when disabled', async () => {
    const message = createMessage();
    const personalEmoteUsers = new Set<string>();
    const getUserPersonalEmotes = jest.fn(() => [sevenTvPersonalEmote]);
    const fetchUserPersonalEmotes = jest
      .fn()
      .mockResolvedValue([sevenTvPersonalEmote]);
    const reprocessMessage = jest.fn();

    const didReprocess = await hydrateVisibleSevenTvAssets({
      channelId: 'channel-id',
      messages: [message],
      hydratedMessageKeys: new Set(),
      personalEmoteUsers,
      cosmeticUsers: new Set(['twitch-user']),
      getUserPersonalEmotes,
      fetchUserPersonalEmotes,
      getUserBadge: jest.fn(() => null),
      fetchUserCosmetics: jest.fn(),
      hydratePersonalEmotes: false,
      reprocessMessage,
    });

    expect(getUserPersonalEmotes).not.toHaveBeenCalled();
    expect(fetchUserPersonalEmotes).not.toHaveBeenCalled();
    expect(personalEmoteUsers.has('twitch-user')).toBe(false);
    expect(reprocessMessage).not.toHaveBeenCalled();
    expect(didReprocess).toBe(false);
  });

  test('fetches missing 7TV badge data for visible chat and reprocesses once cached', async () => {
    const message = createMessage();
    const reprocessMessage = jest.fn();
    const getUserBadge = jest
      .fn()
      .mockReturnValueOnce(null)
      .mockReturnValueOnce(sevenTvBadge);
    const fetchUserCosmetics = jest.fn().mockResolvedValue(undefined);

    await hydrateVisibleSevenTvAssets({
      channelId: 'channel-id',
      messages: [message],
      hydratedMessageKeys: new Set(),
      personalEmoteUsers: new Set(['twitch-user']),
      cosmeticUsers: new Set(),
      getUserPersonalEmotes: jest.fn(() => []),
      fetchUserPersonalEmotes: jest.fn(),
      getUserBadge,
      fetchUserCosmetics,
      reprocessMessage,
    });

    expect(fetchUserCosmetics).toHaveBeenCalledWith('twitch-user', {
      retryMissingBadge: true,
    });
    expect(reprocessMessage).toHaveBeenCalledWith(message);
  });

  test('limits visible-user cosmetic fetches per hydration pass', async () => {
    const fetchUserCosmetics = jest.fn().mockResolvedValue(undefined);

    await hydrateVisibleSevenTvAssets({
      channelId: 'channel-id',
      messages: ['1', '2', '3', '4', '5'].map(createMessageForUser),
      hydratedMessageKeys: new Set(),
      personalEmoteUsers: new Set(['1', '2', '3', '4', '5']),
      cosmeticUsers: new Set(),
      getUserPersonalEmotes: jest.fn(() => []),
      fetchUserPersonalEmotes: jest.fn(),
      getUserBadge: jest.fn(() => null),
      fetchUserCosmetics,
      reprocessMessage: jest.fn(),
    });

    expect(fetchUserCosmetics).toHaveBeenCalledTimes(3);
  });

  test('does not fetch or reprocess 7TV badges when disabled', async () => {
    const message = createMessage();
    const cosmeticUsers = new Set<string>();
    const getUserBadge = jest.fn(() => sevenTvBadge);
    const fetchUserCosmetics = jest.fn().mockResolvedValue(undefined);
    const reprocessMessage = jest.fn();

    await hydrateVisibleSevenTvAssets({
      channelId: 'channel-id',
      messages: [message],
      hydratedMessageKeys: new Set(),
      personalEmoteUsers: new Set(['twitch-user']),
      cosmeticUsers,
      getUserPersonalEmotes: jest.fn(() => []),
      fetchUserPersonalEmotes: jest.fn(),
      getUserBadge,
      fetchUserCosmetics,
      hydrateCosmetics: false,
      reprocessMessage,
    });

    expect(getUserBadge).not.toHaveBeenCalled();
    expect(fetchUserCosmetics).not.toHaveBeenCalled();
    expect(cosmeticUsers.has('twitch-user')).toBe(false);
    expect(reprocessMessage).not.toHaveBeenCalled();
  });

  test('reprocesses visible shared chat messages missing the source badge', async () => {
    const message = createMessage();
    message.userstate['source-room-id'] = 'source-room';
    const reprocessMessage = jest.fn();

    await hydrateVisibleSevenTvAssets({
      channelId: 'channel-id',
      messages: [message],
      hydratedMessageKeys: new Set(),
      personalEmoteUsers: new Set(['twitch-user']),
      cosmeticUsers: new Set(['twitch-user']),
      getUserPersonalEmotes: jest.fn(() => []),
      fetchUserPersonalEmotes: jest.fn(),
      getUserBadge: jest.fn(() => null),
      fetchUserCosmetics: jest.fn(),
      reprocessMessage,
    });

    expect(reprocessMessage).toHaveBeenCalledWith(message);
  });

  test('does not reprocess already-hydrated visible messages with the same assets', async () => {
    const message = createMessage();
    const hydratedMessageKeys = new Set<string>();
    const reprocessMessage = jest.fn();

    const params = {
      channelId: 'channel-id',
      messages: [message],
      hydratedMessageKeys,
      personalEmoteUsers: new Set(['twitch-user']),
      cosmeticUsers: new Set(['twitch-user']),
      getUserPersonalEmotes: jest.fn(() => [sevenTvPersonalEmote]),
      fetchUserPersonalEmotes: jest.fn(),
      getUserBadge: jest.fn(() => sevenTvBadge),
      fetchUserCosmetics: jest.fn(),
      reprocessMessage,
    };

    const firstPassDidReprocess = await hydrateVisibleSevenTvAssets(params);
    const secondPassDidReprocess = await hydrateVisibleSevenTvAssets(params);

    expect(reprocessMessage).toHaveBeenCalledTimes(1);
    expect(firstPassDidReprocess).toBe(true);
    expect(secondPassDidReprocess).toBe(false);
  });

  // When bulk cosmetics land, every visible message has cached assets and the
  // whole screenful used to re-parse synchronously in a single tick (Sentry #1
  // chat hotspot, p75 157ms). The reprocess calls must be spread across
  // event-loop turns so frames can interleave.
  test('spreads cached-asset reprocessing across event-loop turns', async () => {
    const messages = Array.from({ length: 24 }, (_, index) =>
      createMessageForUser(`turn-user-${index}`),
    );

    let turn = 0;
    let tickerActive = true;
    const tick = () => {
      turn += 1;
      if (tickerActive) {
        setTimeout(tick, 0);
      }
    };
    setTimeout(tick, 0);

    const reprocessTurns: number[] = [];

    await hydrateVisibleSevenTvAssets({
      channelId: 'channel-id',
      messages,
      hydratedMessageKeys: new Set(),
      personalEmoteUsers: new Set(),
      cosmeticUsers: new Set(
        Array.from({ length: 24 }, (_, index) => `turn-user-${index}`),
      ),
      getUserPersonalEmotes: jest.fn(() => []),
      fetchUserPersonalEmotes: jest.fn().mockResolvedValue([]),
      getUserBadge: jest.fn(() => sevenTvBadge),
      fetchUserCosmetics: jest.fn(),
      reprocessMessage: () => {
        reprocessTurns.push(turn);
      },
      hydratePersonalEmotes: false,
    });
    tickerActive = false;

    const chunkSizes = new Map<number, number>();
    for (const reprocessTurn of reprocessTurns) {
      chunkSizes.set(reprocessTurn, (chunkSizes.get(reprocessTurn) ?? 0) + 1);
    }
    const maxSyncChunk = Math.max(...chunkSizes.values());

    expect(reprocessTurns).toHaveLength(24);
    expect(maxSyncChunk).toBeLessThanOrEqual(6);
  });
});
