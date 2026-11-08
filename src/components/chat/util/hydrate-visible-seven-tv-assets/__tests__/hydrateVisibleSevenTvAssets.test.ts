import {
  createSevenTvBadge,
  createSevenTvEmote,
} from '@app/components/chat/__tests__/__fixtures__/chatFactories.fixture';
import { createChatMessageFixture } from '@app/components/chat/util/__tests__/__fixtures__/chatMessage.fixture';
import type { AnyChatMessageType } from '@app/types/chat/chatMessage';
import { createUserStateTags } from '@app/types/chat/irc-tags/__fixtures__/user-state-tags.fixture';
import { createTextToken } from '@app/utils/chat/__tests__/__fixtures__/messageToken.fixture';

import { hydrateVisibleSevenTvAssets } from '../hydrateVisibleSevenTvAssets';

const sevenTvPersonalEmote = createSevenTvEmote({
  id: 'personal-emote',
  name: 'Personal',
  original_name: 'Personal',
  site: '7TV Personal',
  url: 'https://cdn.7tv.app/emote/personal-emote/4x.webp',
});

const sevenTvBadge = createSevenTvBadge('seven-tv-badge');

function createMessage(): AnyChatMessageType {
  return createChatMessageFixture({
    id: 'message-1_nonce-1',
    message_id: 'message-1',
    message_nonce: 'nonce-1',
    message: [createTextToken('Personal')],
    sender: 'Sender',
    userstate: createUserStateTags({
      'display-name': 'Sender',
      'user-id': 'twitch-user',
      login: 'sender',
      username: 'Sender',
    }),
  });
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

type HydrateVisibleSevenTvAssetsOptions = Parameters<
  typeof hydrateVisibleSevenTvAssets
>[0];

function hydrate(overrides: Partial<HydrateVisibleSevenTvAssetsOptions>) {
  return hydrateVisibleSevenTvAssets({
    channelId: 'channel-id',
    messages: [],
    hydratedMessageKeys: new Set(),
    personalEmoteUsers: new Set(),
    cosmeticUsers: new Set(),
    getUserPersonalEmotes: jest.fn(() => []),
    fetchUserPersonalEmotes: jest.fn(),
    getUserBadge: jest.fn(() => null),
    fetchUserCosmetics: jest.fn(),
    reprocessMessage: jest.fn(),
    publishMessageUpdates: jest.fn(),
    ...overrides,
  });
}

describe('hydrateVisibleSevenTvAssets', () => {
  test('fetches personal emotes on visible cache miss and reprocesses once image data resolves', async () => {
    const message = createMessage();
    const reprocessMessage = jest.fn();

    const fetchUserPersonalEmotes = jest
      .fn()
      .mockResolvedValue([sevenTvPersonalEmote]);

    const didReprocess = await hydrate({
      messages: [message],
      cosmeticUsers: new Set(['twitch-user']),
      fetchUserPersonalEmotes,
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

    await hydrate({
      messages: [message],
      personalEmoteUsers,
      cosmeticUsers: new Set(['twitch-user']),
      fetchUserPersonalEmotes,
    });

    expect(fetchUserPersonalEmotes).toHaveBeenCalledTimes(1);

    expect(personalEmoteUsers.has('twitch-user')).toBe(true);
  });

  test('keeps the per-user guard when a user genuinely has no personal emotes', async () => {
    const message = createMessage();
    const personalEmoteUsers = new Set<string>();
    const fetchUserPersonalEmotes = jest.fn().mockResolvedValue([]);

    await hydrate({
      messages: [message],
      personalEmoteUsers,
      cosmeticUsers: new Set(['twitch-user']),
      fetchUserPersonalEmotes,
    });

    expect(fetchUserPersonalEmotes).toHaveBeenCalledTimes(1);

    expect(personalEmoteUsers.has('twitch-user')).toBe(true);
  });

  test('limits visible-user personal emote fetches per hydration pass', async () => {
    const fetchUserPersonalEmotes = jest.fn().mockResolvedValue([]);

    const didReprocess = await hydrate({
      messages: ['1', '2', '3', '4', '5'].map(createMessageForUser),
      cosmeticUsers: new Set(['1', '2', '3', '4', '5']),
      fetchUserPersonalEmotes,
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

    const didReprocess = await hydrate({
      messages: [message],
      personalEmoteUsers,
      cosmeticUsers: new Set(['twitch-user']),
      getUserPersonalEmotes,
      fetchUserPersonalEmotes,
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

    await hydrate({
      messages: [message],
      personalEmoteUsers: new Set(['twitch-user']),
      getUserBadge,
      fetchUserCosmetics,
      reprocessMessage,
    });

    expect(fetchUserCosmetics).toHaveBeenCalledWith('twitch-user', {
      retryMissingBadge: true,
    });

    expect(reprocessMessage).toHaveBeenCalledWith(message);
  });

  test('limits visible-user cosmetic fetches to 16 per hydration pass on iOS', async () => {
    const fetchUserCosmetics = jest.fn().mockResolvedValue(undefined);
    const userIds = Array.from({ length: 20 }, (_, index) => `${index}`);

    await hydrate({
      messages: userIds.map(createMessageForUser),
      personalEmoteUsers: new Set(userIds),
      fetchUserCosmetics,
    });

    expect(fetchUserCosmetics).toHaveBeenCalledTimes(16);
  });

  test('does not fetch or reprocess 7TV badges when disabled', async () => {
    const message = createMessage();
    const cosmeticUsers = new Set<string>();
    const getUserBadge = jest.fn(() => sevenTvBadge);
    const fetchUserCosmetics = jest.fn().mockResolvedValue(undefined);
    const reprocessMessage = jest.fn();

    await hydrate({
      messages: [message],
      personalEmoteUsers: new Set(['twitch-user']),
      cosmeticUsers,
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

    await hydrate({
      messages: [message],
      personalEmoteUsers: new Set(['twitch-user']),
      cosmeticUsers: new Set(['twitch-user']),
      reprocessMessage,
    });

    expect(reprocessMessage).toHaveBeenCalledWith(message);
  });

  test('does not reprocess already-hydrated visible messages with the same assets', async () => {
    const message = createMessage();
    const hydratedMessageKeys = new Set<string>();
    const reprocessMessage = jest.fn();

    const params = {
      messages: [message],
      hydratedMessageKeys,
      personalEmoteUsers: new Set(['twitch-user']),
      cosmeticUsers: new Set(['twitch-user']),
      getUserPersonalEmotes: jest.fn(() => [sevenTvPersonalEmote]),
      getUserBadge: jest.fn(() => sevenTvBadge),
      reprocessMessage,
    };

    const firstPassDidReprocess = await hydrate(params);
    const secondPassDidReprocess = await hydrate(params);

    expect(reprocessMessage).toHaveBeenCalledTimes(1);

    expect(firstPassDidReprocess).toBe(true);

    expect(secondPassDidReprocess).toBe(false);
  });

  // Reprocess calls must spread across event-loop turns: a whole screenful
  // re-parsing in one tick was the #1 Sentry chat hotspot (p75 157ms).
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

    await hydrate({
      messages,
      cosmeticUsers: new Set(
        Array.from({ length: 24 }, (_, index) => `turn-user-${index}`),
      ),
      fetchUserPersonalEmotes: jest.fn().mockResolvedValue([]),
      getUserBadge: jest.fn(() => sevenTvBadge),
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

  /**
   * The surface can unmount or hop channels while a pass sleeps between
   * slices; stale passes must not keep reprocessing.
   */
  test('stops cached-asset reprocessing once shouldContinue returns false', async () => {
    const messages = Array.from({ length: 24 }, (_, index) =>
      createMessageForUser(`cancel-user-${index}`),
    );

    const reprocessMessage = jest.fn();
    let cancelled = false;

    setTimeout(() => {
      cancelled = true;
    }, 0);

    await hydrate({
      messages,
      cosmeticUsers: new Set(
        Array.from({ length: 24 }, (_, index) => `cancel-user-${index}`),
      ),
      fetchUserPersonalEmotes: jest.fn().mockResolvedValue([]),
      getUserBadge: jest.fn(() => sevenTvBadge),
      reprocessMessage,
      hydratePersonalEmotes: false,
      shouldContinue: () => !cancelled,
    });

    expect(reprocessMessage.mock.calls.length).toBeLessThan(24);
  });
});
