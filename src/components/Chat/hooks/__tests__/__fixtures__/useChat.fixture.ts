import type { ChatMessageType } from '@app/store/chat/types/constants';
import type { getCurrentEmoteData } from '@app/store/chat/actions/channelLoad';
import type { SanitisedEmote } from '@app/types/emote';
import { createBaseMessage } from '../../../util/messageHandlers';

type CurrentEmoteData = NonNullable<ReturnType<typeof getCurrentEmoteData>>;
type UserChatMessage = ChatMessageType<'usernotice'>;
type SevenTvChannelEmote = Extract<SanitisedEmote, { site: '7TV Channel' }>;

export function createSevenTvEmote(
  overrides: Partial<SevenTvChannelEmote> = {},
): SevenTvChannelEmote {
  return {
    id: 'emote-1',
    name: 'OMEGALUL',
    original_name: 'OMEGALUL',
    url: 'https://cdn.example.test/emote.webp',
    static_url: 'https://cdn.example.test/emote.png',
    image_variants: {
      animated: { '1x': 'https://cdn.example.test/emote.webp' },
      static: { '1x': 'https://cdn.example.test/emote.png' },
    },
    creator: null,
    emote_link: 'https://7tv.app/emotes/emote-1',
    site: '7TV Channel',
    frame_count: 12,
    format: 'WEBP',
    flags: 0,
    aspect_ratio: 1,
    zero_width: false,
    width: 32,
    height: 32,
    set_metadata: {
      setId: 'set-1',
      setName: 'Channel Set',
      capacity: 500,
      ownerId: 'owner-1',
      kind: 'NORMAL',
      updatedAt: '2026-06-08T00:00:00.000Z',
      totalCount: 1,
    },
    ...overrides,
  };
}

export function createEmoteData(
  overrides: Partial<CurrentEmoteData> = {},
): CurrentEmoteData {
  return {
    twitchChannelEmotes: [],
    twitchGlobalEmotes: [],
    twitchSubscriberEmotes: [],
    sevenTvChannelEmotes: [],
    sevenTvGlobalEmotes: [],
    ffzChannelEmotes: [],
    ffzGlobalEmotes: [],
    bttvGlobalEmotes: [],
    bttvChannelEmotes: [],
    twitchChannelBadges: [],
    twitchGlobalBadges: [],
    ffzChannelBadges: [],
    ffzGlobalBadges: [],
    chatterinoBadges: [],
    ...overrides,
  };
}

export function createChatTags(
  overrides: Record<string, string> = {},
): Record<string, string> {
  const id = overrides.id ?? 'msg-1';
  const login = overrides.login ?? 'viewer';
  const displayName = overrides['display-name'] ?? 'Viewer';
  const userId = overrides['user-id'] ?? 'user-1';

  return {
    id,
    login,
    'display-name': displayName,
    'user-id': userId,
    badges: overrides.badges ?? '',
    color: overrides.color ?? '#9146ff',
    'tmi-sent-ts': overrides['tmi-sent-ts'] ?? '1780876800000',
    emotes: overrides.emotes ?? '',
    mod: overrides.mod ?? '0',
    subscriber: overrides.subscriber ?? '0',
    turbo: overrides.turbo ?? '0',
    'emote-sets': overrides['emote-sets'] ?? '',
    'user-type': overrides['user-type'] ?? '',
    ...overrides,
  };
}

export function createChatMessage({
  broadcasterId = 'channel-1',
  channelName = 'foam',
  overrides = {},
  tags = {},
  text = 'hello chat',
}: {
  broadcasterId?: string;
  channelName?: string;
  overrides?: Partial<UserChatMessage>;
  tags?: Record<string, string>;
  text?: string;
} = {}): UserChatMessage {
  const message = createBaseMessage({
    broadcasterId,
    channelName,
    tags: createChatTags(tags),
    text,
  });

  return {
    ...message,
    ...overrides,
  };
}

export function createMessageActionData(
  message: UserChatMessage = createChatMessage(),
) {
  return {
    badges: message.badges,
    color: message.userstate.color,
    message: message.message,
    messageData: message,
    username: message.sender,
    userstate: message.userstate,
  };
}
