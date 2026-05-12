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
  } as AnyChatMessageType;
}

describe('hydrateVisibleSevenTvAssets', () => {
  test('fetches personal emotes on visible cache miss and reprocesses once image data resolves', async () => {
    const message = createMessage();
    const reprocessMessage = jest.fn();
    const fetchUserPersonalEmotes = jest
      .fn()
      .mockResolvedValue([sevenTvPersonalEmote]);

    await hydrateVisibleSevenTvAssets({
      channelId: 'channel-id',
      messages: [message],
      personalEmoteUsers: new Set(),
      cosmeticUsers: new Set(['twitch-user']),
      getUserPersonalEmotes: jest.fn(() => []),
      fetchUserPersonalEmotes,
      getUserBadge: jest.fn(() => undefined),
      fetchUserCosmetics: jest.fn(),
      reprocessMessage,
    });

    expect(fetchUserPersonalEmotes).toHaveBeenCalledWith(
      'twitch-user',
      'channel-id',
    );
    expect(reprocessMessage).toHaveBeenCalledWith(message);
  });

  test('fetches missing 7TV badge data for visible chat and reprocesses once cached', async () => {
    const message = createMessage();
    const reprocessMessage = jest.fn();
    const getUserBadge = jest
      .fn()
      .mockReturnValueOnce(undefined)
      .mockReturnValueOnce(sevenTvBadge);
    const fetchUserCosmetics = jest.fn().mockResolvedValue(undefined);

    await hydrateVisibleSevenTvAssets({
      channelId: 'channel-id',
      messages: [message],
      personalEmoteUsers: new Set(['twitch-user']),
      cosmeticUsers: new Set(),
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

  test('reprocesses visible shared chat messages missing the source badge', async () => {
    const message = createMessage();
    message.userstate['source-room-id'] = 'source-room';
    const reprocessMessage = jest.fn();

    await hydrateVisibleSevenTvAssets({
      channelId: 'channel-id',
      messages: [message],
      personalEmoteUsers: new Set(['twitch-user']),
      cosmeticUsers: new Set(['twitch-user']),
      getUserPersonalEmotes: jest.fn(() => []),
      fetchUserPersonalEmotes: jest.fn(),
      getUserBadge: jest.fn(() => undefined),
      fetchUserCosmetics: jest.fn(),
      reprocessMessage,
    });

    expect(reprocessMessage).toHaveBeenCalledWith(message);
  });
});
