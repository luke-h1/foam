/* eslint-disable default-param-last */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable no-underscore-dangle */
/* eslint-disable no-restricted-syntax */
import { nanoid } from '@reduxjs/toolkit';
import { PrivateMessage, UserNotice } from '@twurple/chat';
import { parseMessage, type MessageTypes } from 'ircv3';
import { RootState } from '..';
import {
  highlightRegExpSelector,
  showCardsSelector,
} from '../options/selectors';
import { badgesSelector, meBadgesSelector } from '../selectors/badges';
import { emotesSelector } from '../selectors/emote';
import {
  MessagePart,
  MessageTypePrivate,
  MessageType,
  MessageTypeUserNotice,
  MessageTypeNotice,
  Messages,
  IRCV3_KNOWN_COMMANDS,
} from '../services/types/messages';
import { blockedUsersSelector, meSelector } from '../slices/chat/selectors';
import createMessageBadges from './createMessageBadges';
import createMessageCard from './createMessageCard';
import createMessageParts from './createMessageParts';
import getIrcChannelName from './getChannelName';
import parseBadgesTag from './parseBadgesTag';

const parsePrivMsgBody = (
  content: string,
): [body: string, isAction: boolean] => {
  console.log('[parsePrivMsgBody] content ->', content);

  if (!content) {
    console.warn('no content');
  }

  return content.startsWith('\u0001ACTION ')
    ? [content.slice(8, -1), true]
    : [content, false];
};

// badges
export const createCreateBadges = (state: RootState) => {
  const allBadges = badgesSelector(state);
  return (userId: string, badgesTag = '', badges?: Record<string, string>) => {
    const userBadges = badges || parseBadgesTag(badgesTag);
    return createMessageBadges(allBadges, userBadges, userId);
  };
};

// parts
export const createCreateParts = (state: RootState) => {
  const allEmotes = emotesSelector(state);

  return (body: string, emotesTag = '', isSelf = false) => {
    return createMessageParts(body, allEmotes, emotesTag, isSelf);
  };
};

// card
export const createCreateCard = (state: RootState) => {
  const { twitch, youtube } = showCardsSelector(state);

  return (parts: MessagePart[]) => createMessageCard(parts, twitch, youtube);
};

export const createPrivateMessage = (state: RootState) => {
  const createBadges = createCreateBadges(state);
  const createParts = createCreateParts(state);
  const createCard = createCreateCard(state);
  const blockedUsers = blockedUsersSelector(state);
  const highlightRegExp = highlightRegExpSelector(state);

  return (msg: PrivateMessage): MessageTypePrivate | null => {
    const user = msg.userInfo;

    if (blockedUsers?.includes(user.userName)) {
      return null;
    }

    const channelName = getIrcChannelName(msg);

    console.log('MESSAGE IS HERE ->', msg);
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const [body, isAction] = parsePrivMsgBody(msg.content.value);

    const _tags: MessageTypePrivate['_tags'] = {
      emotes: msg.tags.get('emotes') || '',
      badges: msg.tags.get('badges') || '',
    };

    const parts = createParts(body, _tags.emotes);
    const badges = createBadges(user.userId, _tags.badges);
    const card = createCard(parts);

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
      isHighlighted: !!highlightRegExp?.test(body),
      _tags,
    };
  };
};

export const createUserNotice = (
  msg: UserNotice,
  state: RootState,
): MessageTypeUserNotice => {
  const channelName = msg.channel.value;
  const body = msg.message?.value;
  const user = msg.userInfo;
  const noticeType = msg.tags.get('msg-id') || '';
  const systemMessage = (msg.tags.get('system-msg') || '').replace(/\\s/g, ' ');

  const _tags: MessageTypeUserNotice['_tags'] = {
    emotes: msg.tags.get('emotes') || '',
    badges: msg.tags.get('badges') || '',
  };

  const parts = createCreateParts(state)(body, _tags.emotes);
  const badges = createCreateBadges(state)(user.userId, _tags.badges);

  return {
    type: MessageType.USER_NOTICE,
    id: msg.id,
    channelName,
    timestamp: msg.date.getTime(),
    user: {
      id: user.userId!,
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
};

export const createNotice = (
  msg: MessageTypes.Commands.Notice,
): MessageTypeNotice => ({
  type: MessageType.NOTICE,
  id: msg.tags.get('msg-id') || nanoid(),
  channelName: getIrcChannelName(msg),
  body: msg.text,
  noticeType: msg.tags.get('msg-id') || '',
});

export const createOwnMessage = (
  channelName: string,
  text: string,
  state: RootState,
): MessageTypePrivate => {
  let body = text;
  let isAction = false;

  console.log('[createOwnMessage] text ->', text);

  if (text.startsWith('/me')) {
    body = text.slice(4);
    isAction = true;
  }

  const user = meSelector(state);
  const parts = createCreateParts(state)(body, '', true);
  const badges = meBadgesSelector(state);
  const card = createCreateCard(state)(parts);

  return {
    type: MessageType.PRIVATE_MESSAGE,
    id: nanoid(),
    channelName,
    timestamp: Date.now(),
    user: {
      id: user.id!,
      login: user.login!,
      displayName: user.displayName,
      color: user.color,
    },
    badges,
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
};

export const createHistoryMessages = (
  messages: string[],
  state: RootState,
): Messages[] => {
  const createPrivateMessageWithState = createPrivateMessage(state);
  const result: Messages[] = [];

  for (const message of messages) {
    // https://github.com/twurple/twurple/blob/main/packages/chat/src/utils/messageUtil.ts#L48
    const msg = parseMessage(message, undefined, IRCV3_KNOWN_COMMANDS, false);

    if (msg.command === 'PRIVMSG') {
      const m = createPrivateMessageWithState(msg as PrivateMessage);

      if (m) {
        m.isHistory = true;
        m.id = `${m.id}-history`;
        result.push(m);
      }
    }
  }
  return result;
};
