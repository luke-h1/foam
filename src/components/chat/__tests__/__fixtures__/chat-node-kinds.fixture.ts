/* eslint-disable camelcase */
import type { ChatDensity } from '@app/components/chat/components/chat-message/util/chat-scale';
import type { ChatMessageDisplayFlags } from '@app/components/chat/types/chat-ui-flags';
import type {
  AnyChatMessageType,
  ChatMessageType,
} from '@app/store/chat/types/constants';
import type {
  ChatFontScale,
  CustomHighlight,
} from '@app/store/preference-store';
import { createUserStateTags } from '@app/types/chat/irc-tags/__fixtures__/user-state-tags.fixture';
import type { UserStateTags } from '@app/types/chat/irc-tags/userstate';
import type { SanitisedBadgeSet } from '@app/types/twitch/badge';
import { createModeratedMessageText } from '@app/utils/chat/create-moderated-message-text';
import { parseIrcMessage } from '@app/utils/chat/irc-protocol/parse-irc-message';
import { coerceUserNoticeTags } from '@app/utils/chat/message-handlers/coerce-user-notice-tags';
import { createSystemMessage } from '@app/utils/chat/message-handlers/create-system-message';
import { createUserNoticeMessage } from '@app/utils/chat/message-handlers/create-user-notice-message';
import type { MessageToken } from '@app/utils/chat/message-token';

import {
  ANNOUNCEMENT,
  CHARITY,
  MOD_ANNIVERSARY,
  RAID,
  RESUB,
  RITUAL,
  SUBGIFT,
  SUBMYSTERYGIFT,
  WATCH_STREAK,
} from './chat-notice-pipeline.fixture';

/**
 * One entry per kind of row the chat renders. The perf test renders a screen
 * of each and compares it with `plain-text`, so a new renderer gets a row
 * here the day it lands.
 */
export interface ChatNodeKindFixture {
  id: string;
  messages: AnyChatMessageType[];
  row: {
    customHighlights?: CustomHighlight[];
    density: ChatDensity;
    fontScale: ChatFontScale;
    highlightedUserSet?: ReadonlySet<string>;
    messageDisplay: ChatMessageDisplayFlags;
  };
}

export const ROWS_PER_KIND = 24;

export const BUSY_CHAT_ROWS = 40;

/**
 * The user ids that carry a 7TV paint; the perf test binds paints to them in
 * the store before it measures.
 */
export const PAINTED_USER_ID_PREFIX = 'painted-user-';

const SENDER_COLORS = [
  '#9146ff',
  '#1e90ff',
  '#ff4500',
  '#2e8b57',
  '#daa520',
  '#ff69b4',
];

const BASE_DISPLAY: ChatMessageDisplayFlags = {
  disableEmoteAnimations: true,
  showInlineReplyContext: true,
  showTimestamp: true,
};

const BASE_ROW: ChatNodeKindFixture['row'] = {
  density: 'comfortable',
  fontScale: 'default',
  messageDisplay: BASE_DISPLAY,
};

function sevenTvEmote(
  name: string,
  id: string,
  extra: Partial<MessageToken<'emote'>> = {},
): MessageToken<'emote'> {
  const base = `https://cdn.7tv.app/emote/${id}`;

  return {
    type: 'emote',
    content: name,
    id,
    name,
    creator: 'creator',
    emote_link: `https://7tv.app/emotes/${id}`,
    original_name: name,
    site: '7TV Channel',
    provider: '7tv',
    url: `${base}/4x.avif`,
    static_url: `${base}/4x_static.avif`,
    image_variants: {
      animated: { '2x': `${base}/2x.avif`, '4x': `${base}/4x.avif` },
      static: {
        '2x': `${base}/2x_static.avif`,
        '4x': `${base}/4x_static.avif`,
      },
    },
    width: 128,
    height: 128,
    aspect_ratio: 1,
    zero_width: false,
    ...extra,
  };
}

function twitchEmote(name: string, id: string): MessageToken<'emote'> {
  const base = `https://static-cdn.jtvnw.net/emoticons/v2/${id}`;

  return {
    type: 'emote',
    content: name,
    id,
    name,
    creator: '',
    emote_link: `${base}/default/dark/3.0`,
    original_name: name,
    site: 'Twitch Global',
    provider: 'twitch',
    url: `${base}/default/dark/3.0`,
    static_url: `${base}/static/dark/3.0`,
    width: 56,
    height: 56,
    aspect_ratio: 1,
    zero_width: false,
  };
}

function text(content: string): MessageToken<'text'> {
  return { type: 'text', content };
}

function badge(
  provider: SanitisedBadgeSet['provider'],
  set: string,
  id: string,
  extra: Partial<SanitisedBadgeSet> = {},
): SanitisedBadgeSet {
  const urlByProvider = {
    '7tv': `https://cdn.7tv.app/badge/${id}/3x.webp`,
    bttv: `https://cdn.betterttv.net/badges/${id}.svg`,
    chatterino: `https://fourtf.com/chatterino/badges/${id}.png`,
    ffz: `https://cdn.frankerfacez.com/badge/${id}/4/rounded`,
    twitch: `https://static-cdn.jtvnw.net/badges/v1/${id}/2`,
  } satisfies Record<SanitisedBadgeSet['provider'], string>;

  return {
    id,
    set,
    title: `${set} ${id}`,
    type: 'Twitch Channel Badge',
    url: urlByProvider[provider],
    provider,
    ...extra,
  };
}

interface MessageOverrides {
  badges?: SanitisedBadgeSet[];
  isAction?: boolean;
  message?: MessageToken[];
  moderationNotice?: string;
  parentDisplayName?: string;
  replyBody?: string;
  replyDisplayName?: string;
  userstate?: Partial<UserStateTags>;
  userId?: string;
  flags?: Partial<
    Pick<
      ChatMessageType<'usernotice'>,
      'isChannelPointRedemption' | 'isHighlightedMessage'
    >
  >;
}

function userMessage(
  kind: string,
  index: number,
  overrides: MessageOverrides = {},
): ChatMessageType<'usernotice'> {
  const senderIndex = index % 24;
  const sender = `user${senderIndex}`;
  const color = SENDER_COLORS[senderIndex % SENDER_COLORS.length]!;
  const userId = overrides.userId ?? `user-id-${senderIndex}`;

  return {
    id: `${kind}-${index}_nonce-${index}`,
    message_id: `${kind}-${index}`,
    message_nonce: `nonce-${index}`,
    sender,
    channel: 'foam',
    badges: overrides.badges ?? [],
    cachedSenderColor: color,
    message: overrides.message ?? [text(`regular chat message ${index}`)],
    replyBody: overrides.replyBody ?? '',
    replyDisplayName: overrides.replyDisplayName ?? '',
    parentDisplayName: overrides.parentDisplayName ?? '',
    timestamp: '12:00',
    isAction: overrides.isAction,
    moderationNotice: overrides.moderationNotice,
    ...overrides.flags,
    userstate: createUserStateTags({
      username: sender,
      login: sender,
      color,
      'display-name': sender,
      'user-id': userId,
      badges: {},
      'badges-raw': '',
      'user-type': '',
      mod: '0',
      subscriber: '0',
      turbo: '0',
      'emote-sets': '',
      id: `${kind}-${index}`,
      ...overrides.userstate,
    }),
  };
}

function rows(
  build: (index: number) => AnyChatMessageType,
  count = ROWS_PER_KIND,
): AnyChatMessageType[] {
  return Array.from({ length: count }, (_, index) => build(index));
}

function noticeFromIrc(line: string, index: number): AnyChatMessageType {
  const parsed = parseIrcMessage(line);

  if (!parsed?.tags) {
    throw new Error(`Fixture line did not parse as IRC: ${line}`);
  }

  const notice = createUserNoticeMessage({
    tags: coerceUserNoticeTags({
      ...parsed.tags,
      id: `${parsed.tags.id}-${index}`,
    }),
    channelName: 'foam',
    text: parsed.params[1] ?? '',
    broadcasterId: 'broadcaster-1',
  });

  return { ...notice, timestamp: '12:00' };
}

const LONG_TEXT =
  'this is a much longer chat message that wraps over several lines on a ' +
  'phone because the sender had a lot to say about the play that just ' +
  'happened and wanted everyone in chat to know exactly how they felt ' +
  'about it right now';

const TWITCH_BADGES = [
  badge('twitch', 'moderator', '1'),
  badge('twitch', 'subscriber', '12'),
  badge('twitch', 'bits', '1000'),
];

const SEVEN_TV_BADGES = [
  badge('7tv', '7tv', '01F2SAQ6J80006G3R48W6T4V0E', { type: '7TV Badge' }),
];

const FFZ_BADGES = [
  badge('ffz', 'ffz', '3', { type: 'FFZ Badge', owner_username: 'user1' }),
];

const BTTV_BADGES = [
  badge('bttv', 'bttv', 'user-id-1', { type: 'BTTV Badge' }),
];

const TINTED_BADGES = [
  badge('ffz', 'ffz', '2', { type: 'FFZ Badge', color: '#5f9ea0' }),
  badge('7tv', '7tv', '01F2SAQ6J80006G3R48W6T4V0E', {
    type: '7TV Badge',
    color: '#ff8800',
  }),
];

function plainRows(id: string, row: Partial<ChatNodeKindFixture['row']>) {
  return {
    id,
    messages: rows(index => userMessage(id, index)),
    row: { ...BASE_ROW, ...row },
  };
}

function staticEmoteMessage(index: number): MessageToken[] {
  return [
    text('look at this '),
    sevenTvEmote('PogChamp', `01F71VQYHR000D3ZZ6Q11NR7T${index % 10}`),
    text(' and '),
    twitchEmote('Kappa', `2500${index % 10}`),
    text(` ${index}`),
  ];
}

function paintedRows(id: string, paintSlot: number): ChatNodeKindFixture {
  return {
    id,
    messages: rows(index =>
      userMessage(id, index, {
        userId: `${PAINTED_USER_ID_PREFIX}${paintSlot}`,
      }),
    ),
    row: BASE_ROW,
  };
}

export const chatNodeKinds: ChatNodeKindFixture[] = [
  plainRows('plain-text', {}),
  {
    id: 'long-text',
    messages: rows(index =>
      userMessage('long-text', index, {
        message: [text(`${LONG_TEXT} ${index}`)],
      }),
    ),
    row: BASE_ROW,
  },
  {
    id: 'static-emotes',
    messages: rows(index =>
      userMessage('static-emotes', index, {
        message: staticEmoteMessage(index),
      }),
    ),
    row: BASE_ROW,
  },
  {
    id: 'animated-emotes',
    messages: rows(index =>
      userMessage('animated-emotes', index, {
        message: staticEmoteMessage(index),
      }),
    ),
    row: {
      ...BASE_ROW,
      messageDisplay: { ...BASE_DISPLAY, disableEmoteAnimations: false },
    },
  },
  {
    id: 'zero-width-emotes',
    messages: rows(index =>
      userMessage('zero-width-emotes', index, {
        message: [
          text('stacked '),
          sevenTvEmote(
            'FeelsDankMan',
            `01F0Z1R7000005V2SW6D0ZZ4${index % 10}`,
            {
              overlaid: [
                sevenTvEmote('RainTime', '01F6MQ2F0000FF1R3ZQ5B9ZZ01', {
                  zero_width: true,
                }),
              ],
            },
          ),
          text(' '),
          sevenTvEmote('SteerR', '01F6MQ2F0000FF1R3ZQ5B9ZZ02', {
            zero_width: true,
          }),
        ],
      }),
    ),
    row: BASE_ROW,
  },
  {
    id: 'emote-only',
    messages: rows(index =>
      userMessage('emote-only', index, {
        message: Array.from({ length: 8 }, (_, slot) =>
          sevenTvEmote(
            'OMEGALUL',
            `01F71VQYHR000D3ZZ6Q11NR7T${(index + slot) % 10}`,
          ),
        ).flatMap((emote, slot) => (slot === 0 ? [emote] : [text(' '), emote])),
      }),
    ),
    row: BASE_ROW,
  },
  {
    id: 'mentions',
    messages: rows(index =>
      userMessage('mentions', index, {
        message: [
          { type: 'mention', content: '@luke' },
          text(' and '),
          { type: 'mention', content: `@user${(index + 1) % 24}` },
          text(' did you see '),
          { type: 'mention', content: `@user${(index + 2) % 24}` },
          text(` ${index}`),
        ],
      }),
    ),
    row: BASE_ROW,
  },
  {
    id: 'links',
    messages: rows(index =>
      userMessage('links', index, {
        message: [
          text('check '),
          {
            type: 'link',
            content: `https://example.com/post/${index}`,
            url: `https://example.com/post/${index}`,
          },
          text(' out'),
        ],
      }),
    ),
    row: BASE_ROW,
  },
  {
    id: 'media-links',
    messages: rows(index =>
      userMessage('media-links', index, {
        message: [
          text('new emote '),
          {
            type: 'stvEmoteLink',
            content: `https://7tv.app/emotes/01F71VQYHR000D3ZZ6Q11NR7T${index % 10}`,
            url: `https://7tv.app/emotes/01F71VQYHR000D3ZZ6Q11NR7T${index % 10}`,
          },
        ],
      }),
    ),
    row: BASE_ROW,
  },
  {
    id: 'cheermotes',
    messages: rows(index =>
      userMessage('cheermotes', index, {
        message: [
          {
            type: 'cheermote',
            content: 'Cheer100',
            cheermote: {
              bits: 100,
              color: '#9c3ee8',
              prefix: 'Cheer',
              static_url:
                'https://d3aqoihi2n8ty8.cloudfront.net/actions/cheer/dark/static/100/2.png',
              url: 'https://d3aqoihi2n8ty8.cloudfront.net/actions/cheer/dark/animated/100/2.gif',
            },
          },
          text(` great play ${index}`),
        ],
        userstate: { bits: '100' },
      }),
    ),
    row: BASE_ROW,
  },
  {
    id: 'badges-twitch',
    messages: rows(index =>
      userMessage('badges-twitch', index, { badges: TWITCH_BADGES }),
    ),
    row: BASE_ROW,
  },
  {
    id: 'badges-7tv',
    messages: rows(index =>
      userMessage('badges-7tv', index, { badges: SEVEN_TV_BADGES }),
    ),
    row: BASE_ROW,
  },
  {
    id: 'badges-ffz',
    messages: rows(index =>
      userMessage('badges-ffz', index, { badges: FFZ_BADGES }),
    ),
    row: BASE_ROW,
  },
  {
    id: 'badges-bttv',
    messages: rows(index =>
      userMessage('badges-bttv', index, { badges: BTTV_BADGES }),
    ),
    row: BASE_ROW,
  },
  {
    id: 'badges-tinted',
    messages: rows(index =>
      userMessage('badges-tinted', index, { badges: TINTED_BADGES }),
    ),
    row: BASE_ROW,
  },
  paintedRows('painted-gradient', 0),
  paintedRows('painted-radial', 1),
  paintedRows('painted-image', 2),
  {
    id: 'reply-context',
    messages: rows(index =>
      userMessage('reply-context', index, {
        parentDisplayName: `user${(index + 3) % 24}`,
        replyBody: `the original message ${index}`,
        replyDisplayName: `user${(index + 3) % 24}`,
        message: [
          { type: 'mention', content: `@user${(index + 3) % 24}` },
          text(` agreed ${index}`),
        ],
        userstate: { 'reply-parent-msg-id': `plain-text-${index}` },
      }),
    ),
    row: BASE_ROW,
  },
  {
    id: 'action-me',
    messages: rows(index =>
      userMessage('action-me', index, {
        isAction: true,
        message: [text(`waves at chat ${index}`)],
      }),
    ),
    row: BASE_ROW,
  },
  {
    id: 'first-message',
    messages: rows(index =>
      userMessage('first-message', index, {
        userstate: { 'first-msg': '1' },
      }),
    ),
    row: BASE_ROW,
  },
  {
    id: 'highlighted-redemption',
    messages: rows(index =>
      userMessage('highlighted-redemption', index, {
        flags: { isChannelPointRedemption: true, isHighlightedMessage: true },
        message: [text(`look at me ${index}`)],
      }),
    ),
    row: BASE_ROW,
  },
  {
    id: 'highlighted-sender',
    messages: rows(index => userMessage('highlighted-sender', index)),
    row: {
      ...BASE_ROW,
      highlightedUserSet: new Set(
        Array.from({ length: 24 }, (_, index) => `user${index}`),
      ),
    },
  },
  {
    id: 'custom-highlight',
    messages: rows(index =>
      userMessage('custom-highlight', index, {
        message: [text(`giveaway starting soon ${index}`)],
      }),
    ),
    row: {
      ...BASE_ROW,
      customHighlights: [
        { id: 'giveaway', phrase: 'giveaway', color: '#ff8800' },
      ],
    },
  },
  {
    id: 'deleted',
    messages: rows(index =>
      userMessage('deleted', index, {
        message: [
          text(
            createModeratedMessageText(
              [text(`regular chat message ${index}`)],
              'Deleted',
            ),
          ),
        ],
        moderationNotice: 'Deleted',
      }),
    ),
    row: BASE_ROW,
  },
  {
    id: 'notice-resub',
    messages: rows(index => noticeFromIrc(RESUB, index)),
    row: BASE_ROW,
  },
  {
    id: 'notice-gift',
    messages: rows(index => noticeFromIrc(SUBGIFT, index)),
    row: BASE_ROW,
  },
  {
    id: 'notice-mystery-gift',
    messages: rows(index => noticeFromIrc(SUBMYSTERYGIFT, index)),
    row: BASE_ROW,
  },
  {
    id: 'notice-raid',
    messages: rows(index => noticeFromIrc(RAID, index)),
    row: BASE_ROW,
  },
  {
    id: 'notice-announcement',
    messages: rows(index => noticeFromIrc(ANNOUNCEMENT, index)),
    row: BASE_ROW,
  },
  {
    id: 'notice-charity',
    messages: rows(index => noticeFromIrc(CHARITY, index)),
    row: BASE_ROW,
  },
  {
    id: 'notice-ritual',
    messages: rows(index => noticeFromIrc(RITUAL, index)),
    row: BASE_ROW,
  },
  {
    id: 'notice-milestone',
    messages: rows(index => noticeFromIrc(WATCH_STREAK, index)),
    row: BASE_ROW,
  },
  {
    id: 'notice-mod-anniversary',
    messages: rows(index => noticeFromIrc(MOD_ANNIVERSARY, index)),
    row: BASE_ROW,
  },
  {
    id: 'system-row',
    messages: rows(index => ({
      ...createSystemMessage('foam', `user${index} was timed out for 600s`),
      id: `system-${index}_nonce-${index}`,
      message_id: `system-${index}`,
      message_nonce: `nonce-${index}`,
      timestamp: '12:00',
    })),
    row: BASE_ROW,
  },
  plainRows('timestamps-off', {
    messageDisplay: { ...BASE_DISPLAY, showTimestamp: false },
  }),
  plainRows('density-compact', { density: 'compact' }),
  plainRows('font-small', { fontScale: 'small' }),
  plainRows('font-large', { fontScale: 'large' }),
];

const kindById = new Map(chatNodeKinds.map(kind => [kind.id, kind]));

function messagesOf(id: string): AnyChatMessageType[] {
  const kind = kindById.get(id);

  if (!kind) {
    throw new Error(`Unknown chat node kind ${id}`);
  }

  return kind.messages;
}

/**
 * A screen of a busy channel: mostly text and emotes, with the rarer rows in
 * roughly the proportion a big chat shows them.
 */
const BUSY_CHAT_MIX: string[] = [
  'plain-text',
  'static-emotes',
  'plain-text',
  'badges-twitch',
  'mentions',
  'static-emotes',
  'plain-text',
  'emote-only',
  'animated-emotes',
  'plain-text',
  'long-text',
  'badges-twitch',
  'plain-text',
  'static-emotes',
  'reply-context',
  'plain-text',
  'painted-gradient',
  'zero-width-emotes',
  'plain-text',
  'notice-resub',
];

export const busyChatRows: AnyChatMessageType[] = Array.from(
  { length: BUSY_CHAT_ROWS },
  (_, index) => {
    const kindId = BUSY_CHAT_MIX[index % BUSY_CHAT_MIX.length]!;
    const source = messagesOf(kindId)[index % ROWS_PER_KIND]!;

    return {
      ...source,
      id: `busy-${index}_${source.id}`,
      message_id: `busy-${index}-${source.message_id}`,
    };
  },
);

export const busyChatRow: ChatNodeKindFixture['row'] = {
  ...BASE_ROW,
  highlightedUserSet: new Set(['user5']),
  customHighlights: [{ id: 'giveaway', phrase: 'giveaway', color: '#ff8800' }],
  messageDisplay: { ...BASE_DISPLAY, disableEmoteAnimations: false },
};
