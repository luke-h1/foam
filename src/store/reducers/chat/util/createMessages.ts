import { RootState } from '@app/store';
import { badgesSelector } from '@app/store/selectors/badges';
import { showCardsSelector } from '@app/store/selectors/cards';
import { emotesSelector } from '@app/store/selectors/emote';
import { nanoid } from '@reduxjs/toolkit';
import { PrivateMessage, UserNotice } from '@twurple/chat';
import { Message, MessageTypes, parseMessage } from 'ircv3';
import createMessageBadges from './createMessageBadges';
import createMessageCard from './createMessageCard';
import createMessageParts from './createMessageParts';
import getIrcChannelName from './getIrcChannelName';
import {
  IRCV3_KNOWN_COMMANDS,
  MessagePart,
  Messages,
  MessageType,
  MessageTypeNotice,
  MessageTypePrivate,
  MessageTypeUserNotice,
} from './messages/types/messages';
import parseBadgesTag from './parseBadgesTag';

function parsePrivMsgBody(content: string): [body: string, isAction: boolean] {
  if (!content) {
    // eslint-disable-next-line no-console
    console.warn('No content');
  }

  return content.startsWith('\u0001ACTION ')
    ? [content.slice(8, -1), true]
    : [content, false];
}

// badges
export function createBadges(state: RootState) {
  const allBadges = badgesSelector(state);

  // eslint-disable-next-line func-names
  return function (
    userId: string,
    // eslint-disable-next-line default-param-last
    badgesTag = '',
    badges?: Record<string, string>,
  ) {
    const userBadges = badges || parseBadgesTag(badgesTag);
    return createMessageBadges(allBadges, userBadges, userId);
  };
}

// parts
export function createParts(state: RootState) {
  const allEmotes = emotesSelector(state);

  // eslint-disable-next-line func-names
  return function (body: string, emotesTag = '', isSelf = false) {
    return createMessageParts(body, allEmotes, emotesTag, isSelf);
  };
}

// card
export function createCard(state: RootState) {
  const { twitch, youtube } = showCardsSelector(state);

  return (parts: MessagePart[]) => createMessageCard(parts, twitch, youtube);
}

export function createPrivateMessage(state: RootState) {
  const createdBadges = createBadges(state);
  const createdParts = createParts(state);
  const createdCard = createCard(state);

  // todo @luke-h1 - fetch this from context.
  // we will need to store this in AuthContext when we fetch the user
  const blockedUsers: string[] = [];

  return (msg: PrivateMessage): MessageTypePrivate | null => {
    const user = msg.userInfo;

    if (blockedUsers.includes(user.userName)) {
      return null;
    }

    const channelName = getIrcChannelName(msg as unknown as Message);
    const [body, isAction] = parsePrivMsgBody(msg.content.value);

    // eslint-disable-next-line no-underscore-dangle
    const _tags: MessageTypePrivate['_tags'] = {
      emotes: msg.tags.get('emotes') || '',
      badges: msg.tags.get('badges') || '',
    };

    const parts = createdParts(body, _tags.emotes);
    const badges = createdBadges(user.userId, _tags.badges);
    const card = createdCard(parts);

    return {
      type: MessageType.PRIVATE_MESSAGE,
      id: msg.id,
      channelName,
      timestamp: msg.date.getTime(),
      user: {
        id: user.userId,
        login: user.userName,
        displayName: user.displayName,
        color: user.color,
      },
      badges,
      parts,
      body,
      card,
      isCheer: msg.isCheer,
      isRedemption: msg.isRedemption,
      isPointsHighlight: msg.isHighlight,
      isAction,
      isDeleted: false,
      isHistory: false,
      isSelf: false,
      // isHighlighted: !!highlightRegExp?.test(body),
      isHighlighted: false,
      _tags,
    };
  };
}

export function createUserNotice(msg: UserNotice, state: RootState) {
  const channelName = msg.channel.value;
  const body = msg.message?.value;
  const user = msg.userInfo;
  const noticeType = msg.tags.get('msg-id') || '';
  const systemMessage = (msg.tags.get('system-msg') || '').replace(/\\s/g, ' ');

  // eslint-disable-next-line no-underscore-dangle
  const _tags: MessageTypeUserNotice['_tags'] = {
    emotes: msg.tags.get('emotes') || '',
    badges: msg.tags.get('badges') || '',
  };

  const parts = createParts(state)(body, _tags.emotes);
  const badges = createBadges(state)(user.userId, _tags.badges);
  return {
    type: MessageType.USER_NOTICE,
    id: msg.id,
    channelName,
    timestamp: msg.date.getTime(),
    user: {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      id: user.userId!,
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      login: user.userName!,
      displayName: user.displayName,
      color: user.color,
    },
    badges,
    parts,
    body,
    noticeType,
    systemMessage,
    _tags,
  };
}

export function createNotice(
  msg: MessageTypes.Commands.Notice,
): MessageTypeNotice {
  return {
    type: MessageType.NOTICE,
    id: msg.tags.get('msg-id') || nanoid(),
    channelName: getIrcChannelName(msg),
    body: msg.text,
    noticeType: msg.tags.get('msg-id') || '',
  };
}

export function createOwnMessage(
  channelName: string,
  text: string,
  state: RootState,
): MessageTypePrivate {
  let body = text;
  let isAction = false;

  if (text.startsWith('/me')) {
    body = text.slice(4);
    isAction = true;
  }

  // todo @luke-h1 - figure out what we're doing with this state - keep in ctx or move to redux?
  const user = {
    id: '1137109694',
    login: 'kv_i1',
    displayName: 'kv_i1',
    color: '#8A2BE2',
  };
  const parts = createParts(state)(body, '', true);
  // const badges = myBadgesSelector(state);
  const card = createCard(state)(parts);

  return {
    type: MessageType.PRIVATE_MESSAGE,
    id: nanoid(),
    channelName,
    timestamp: Date.now(),
    user: {
      id: user.id,
      login: user.login,
      displayName: user.displayName,
      color: user.color,
    },
    badges: [],
    parts,
    body,
    card,
    isCheer: false,
    isRedemption: false,
    isPointsHighlight: false,
    isAction,
    isDeleted: false,
    isHistory: false,
    isSelf: true,
    isHighlighted: false,
    _tags: {},
  };
}

export const createHistoryMessages = (
  messages: string[],
  state: RootState,
): Messages[] => {
  const createPrivateMessageWithState = createPrivateMessage(state);
  const result: Messages[] = [];

  messages.forEach(message => {
    // @ts-expect-error ircv3 type
    const msg = parseMessage(message, undefined, IRCV3_KNOWN_COMMANDS, false);

    if (msg.command === 'PRIVMSG') {
      const m = createPrivateMessageWithState(msg as unknown as PrivateMessage);

      if (m) {
        m.isHistory = true;
        m.id = `${m.id}-history`;
        result.push(m);
      }
    }
  });
  return result;
};
