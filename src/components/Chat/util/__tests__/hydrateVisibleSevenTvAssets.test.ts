import { EmoteSetKind } from '@app/graphql/generated/gql';
import type { SanitisedBadgeSet } from '@app/services/twitch-badge-service';
import type { SanitisedEmote } from '@app/types/emote';
import type { ParsedPart } from '@app/utils/chat/replaceTextWithEmotes';

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
    message: [{ type: 'text', content: 'Personal' }] as ParsedPart[],
    badges: [],
    channel: 'channel',
    parentDisplayName: '',
    replyBody: '',
    replyDisplayName: '',
    sender: 'Sender',
    timestamp: '00:00',
    userstate: {
      'badges-raw': '',
      'display-name': 'Sender',
      'reply-parent-display-name': '',
      'reply-parent-msg-body': '',
      'reply-parent-msg-id': '',
      'reply-parent-user-login': '',
      'user-id': 'twitch-user',
      badges: {},
      login: 'sender',
      username: 'Sender',
    },
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
      disableEmoteAnimations: false,
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

  test('limits visible-user personal emote fetches per hydration pass', async () => {
    const fetchUserPersonalEmotes = jest.fn().mockResolvedValue([]);

    const didReprocess = await hydrateVisibleSevenTvAssets({
      channelId: 'channel-id',
      messages: ['1', '2', '3', '4', '5'].map(createMessageForUser),
      hydratedMessageKeys: new Set(),
      personalEmoteUsers: new Set(),
      cosmeticUsers: new Set(['1', '2', '3', '4', '5']),
      disableEmoteAnimations: false,
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
      disableEmoteAnimations: false,
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
      disableEmoteAnimations: false,
      getUserPersonalEmotes: jest.fn(() => []),
      fetchUserPersonalEmotes: jest.fn(),
      getUserBadge,
      fetchUserCosmetics,
      reprocessMessage,
    });

    expect(fetchUserCosmetics).toHaveBeenCalledWith('twitch-user', {
      allowAfterInitialWindow: true,
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
      disableEmoteAnimations: false,
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
      disableEmoteAnimations: false,
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
      disableEmoteAnimations: false,
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
      disableEmoteAnimations: false,
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

  test('warms visible badge and emote image URLs in bounded batches', async () => {
    const message = createMessage();
    message.badges = [sevenTvBadge];
    message.message = [
      {
        type: 'emote',
        id: 'personal-emote',
        name: 'Personal',
        content: 'Personal',
        url: sevenTvPersonalEmote.url,
        static_url: 'https://cdn.7tv.app/emote/personal-emote/static.webp',
      },
    ] as ParsedPart[];
    const warmVisibleImages = jest.fn();

    await hydrateVisibleSevenTvAssets({
      channelId: 'channel-id',
      messages: [message],
      hydratedMessageKeys: new Set(),
      personalEmoteUsers: new Set(['twitch-user']),
      cosmeticUsers: new Set(['twitch-user']),
      disableEmoteAnimations: true,
      getUserPersonalEmotes: jest.fn(() => []),
      fetchUserPersonalEmotes: jest.fn(),
      getUserBadge: jest.fn(() => null),
      fetchUserCosmetics: jest.fn(),
      warmVisibleImages,
      reprocessMessage: jest.fn(),
    });

    expect(warmVisibleImages).toHaveBeenCalledWith({
      badgeUrls: [sevenTvBadge.url],
      emoteUrls: ['https://cdn.7tv.app/emote/personal-emote/static.webp'],
    });
  });
});
