import { getCurrentEmoteData } from '@app/store/chatStore/channelLoad';
import type { ChatMessageType } from '@app/store/chatStore/constants';
import {
  UserNoticeTags,
  UserNoticeTagsByVariant,
  ViewerMilestoneTags,
} from '@app/types/chat/irc-tags/usernotice';
import { UserStateTags } from '@app/types/chat/irc-tags/userstate';
import {
  createSubscriptionPart,
  createViewerMilestonePart,
} from '@app/utils/chat/formatSubscriptionNotice';
import { parseBadges } from '@app/utils/chat/parseBadges';
import { unescapeIrcTag } from '@app/utils/chat/unescapeIrcTag';
import { generateNonce } from '@app/utils/string/generateNonce';
import omit from 'lodash/omit';

export type AnyChatMessageType =
  | ChatMessageType<'usernotice', 'viewermilestone'>
  | ChatMessageType<'usernotice', 'sub'>
  | ChatMessageType<'usernotice', 'resub'>
  | ChatMessageType<'usernotice', 'subgift'>
  | ChatMessageType<'usernotice', 'anongiftpaidupgrade'>
  | ChatMessageType<'usernotice', 'rewardgift'>
  | ChatMessageType<'usernotice', 'raid'>
  | ChatMessageType<'usernotice'>;

interface CreateBaseMessageParams {
  tags: Record<string, string>;
  channelName: string;
  text: string;
}

export const createUserStateFromTags = (
  tags: Record<string, string>,
): UserStateTags => {
  const badgeData = parseBadges(tags.badges as unknown as string);

  return {
    ...tags,
    username: tags['display-name'] || tags.login || '',
    login: tags.login || tags['display-name']?.toLowerCase() || '',
    'badges-raw': badgeData['badges-raw'],
    badges: badgeData.badges,
    'reply-parent-msg-id': tags['reply-parent-msg-id'] || '',
    'reply-parent-msg-body': tags['reply-parent-msg-body'] || '',
    'reply-parent-display-name': tags['reply-parent-display-name'] || '',
    'reply-parent-user-login': tags['reply-parent-user-login'] || '',
    'user-type': tags['user-type'],
  } as UserStateTags;
};

export const createBaseMessage = ({
  tags,
  channelName,
  text,
}: CreateBaseMessageParams): ChatMessageType<'usernotice'> => {
  const userstate = createUserStateFromTags(tags);
  const messageId = userstate.id || '0';
  const messageNonce = generateNonce();

  return {
    id: `${messageId}_${messageNonce}`,
    userstate,
    message: [{ type: 'text', content: text.trimEnd() }],
    badges: [],
    channel: channelName,
    message_id: messageId,
    message_nonce: messageNonce,
    sender: userstate.username || '',
    parentDisplayName: tags['reply-parent-display-name'] || '',
    replyDisplayName: tags['reply-parent-user-login'] || '',
    replyBody: unescapeIrcTag(tags['reply-parent-msg-body'] || ''),
    parentColor: undefined,
    isChannelPointRedemption: Boolean(tags['custom-reward-id']),
  };
};

export const hasEmoteData = (channelId: string): boolean => {
  const emoteData = getCurrentEmoteData(channelId);
  return !!(
    emoteData &&
    (emoteData.twitchGlobalEmotes.length > 0 ||
      emoteData.sevenTvGlobalEmotes.length > 0 ||
      emoteData.bttvGlobalEmotes.length > 0 ||
      emoteData.ffzGlobalEmotes.length > 0)
  );
};

interface CreateUserNoticeParams {
  tags: UserNoticeTags;
  channelName: string;
  text: string;
}

export const createUserNoticeMessage = ({
  tags,
  channelName,
  text,
}: CreateUserNoticeParams): AnyChatMessageType => {
  const messageNonce = generateNonce();

  const userstate: UserStateTags = {
    ...tags,
    username: tags['display-name'] || tags.login || '',
    login: tags.login || tags['display-name']?.toLowerCase() || '',
    'reply-parent-msg-id': tags['reply-parent-msg-id'] || '',
    'reply-parent-msg-body': tags['reply-parent-msg-body'] || '',
    'reply-parent-display-name': tags['reply-parent-display-name'] || '',
    'reply-parent-user-login': tags['reply-parent-user-login'] || '',
    'user-type': tags['user-type'],
  } as UserStateTags;

  const tagId = 'id' in tags ? (tags as { id?: string }).id : undefined;
  const messageId = tags['msg-id'] || tagId || generateNonce();

  const baseMessage = {
    id: `${messageId}_${messageNonce}`,
    message: [{ type: 'text' as const, content: text.trimEnd() }],
    badges: {},
    channel: channelName,
    message_id: messageId,
    message_nonce: messageNonce,
    sender: userstate.username || '',
    parentDisplayName:
      typeof tags['reply-parent-display-name'] === 'string'
        ? tags['reply-parent-display-name']
        : '',
    replyDisplayName: tags['reply-parent-user-login'] || '',
    replyBody: unescapeIrcTag(
      typeof tags['reply-parent-msg-body'] === 'string'
        ? tags['reply-parent-msg-body']
        : '',
    ),
    ...omit(userstate, 'message'),
  };

  const emptyFields = {
    sender: '',
    replyDisplayName: '',
    replyBody: '',
    channel: '',
    parentDisplayName: '',
  };

  switch (tags['msg-id']) {
    case 'viewermilestone': {
      const viewerMilestoneTags: ViewerMilestoneTags = {
        'msg-id': 'viewermilestone' as const,
        'msg-param-category': (tags['msg-param-category'] ??
          'watch-streak') as 'watch-streak',
        'msg-param-copoReward': tags['msg-param-copoReward'] ?? '',
        'msg-param-id': tags['msg-param-id'] ?? '',
        'msg-param-value': tags['msg-param-value'] ?? '',
        'badge-info': tags['badge-info'] ?? '',
        'display-name': tags['display-name'] ?? '',
        'system-msg': tags['system-msg'] ?? '',
        login: tags.login ?? '',
        'user-id': tags['user-id'] ?? '',
        'user-type': tags['user-type'] ?? '',
        color: tags.color ?? '',
        badges: tags.badges ?? '',
        emotes: tags.emotes ?? '',
        flags: tags.flags ?? '',
        mod: tags.mod ?? '',
      } satisfies ViewerMilestoneTags;

      return {
        ...baseMessage,
        replyDisplayName:
          typeof tags['reply-parent-display-name'] === 'string'
            ? tags['reply-parent-display-name']
            : '',
        replyBody: '',
        badges: [],
        userstate,
        message: [createViewerMilestonePart(viewerMilestoneTags, text)],
        notice_tags: {
          'msg-id': tags['msg-id'],
          'msg-param-category': tags['msg-param-category'],
          'msg-param-copoReward': tags['msg-param-copoReward'] ?? '',
          'msg-param-id': tags['msg-param-id'] ?? '',
          'msg-param-value': tags['msg-param-value'] ?? '',
          'badge-info': tags['badge-info'] ?? '',
          'display-name': tags['display-name'] ?? '',
          'system-msg': tags['system-msg'] ?? '',
          ...emptyFields,
        } satisfies UserNoticeTagsByVariant<'viewermilestone'>,
        isSpecialNotice: true,
      } as ChatMessageType<'usernotice', 'viewermilestone'>;
    }

    case 'resub': {
      return {
        ...baseMessage,
        badges: [],
        message: [createSubscriptionPart(tags, text)],
        userstate,
        notice_tags: { ...tags, ...emptyFields },
        isSpecialNotice: true,
        ...emptyFields,
      } as ChatMessageType<'usernotice', 'resub'>;
    }

    case 'sub': {
      return {
        ...baseMessage,
        notice_tags: tags,
        message_nonce: generateNonce(),
        badges: [],
        message: [createSubscriptionPart(tags, text)],
        userstate,
        isSpecialNotice: true,
        ...emptyFields,
      } as ChatMessageType<'usernotice', 'sub'>;
    }

    case 'subgift': {
      return {
        ...baseMessage,
        badges: [],
        message: [createSubscriptionPart(tags, text)],
        userstate,
        notice_tags: { ...tags, ...emptyFields },
        isSpecialNotice: true,
        ...emptyFields,
      } as ChatMessageType<'usernotice', 'subgift'>;
    }

    case 'anongiftpaidupgrade': {
      return {
        ...baseMessage,
        badges: [],
        message: [createSubscriptionPart(tags, text)],
        userstate,
        notice_tags: { ...tags, ...emptyFields },
        isSpecialNotice: true,
        ...emptyFields,
      } as ChatMessageType<'usernotice', 'anongiftpaidupgrade'>;
    }

    case 'rewardgift': {
      const trimmedText = text.trimEnd();

      return {
        ...baseMessage,
        badges: [],
        message: trimmedText
          ? [{ type: 'text' as const, content: trimmedText }]
          : [],
        userstate,
        notice_tags: { ...tags, ...emptyFields },
        isChannelPointRedemption: true,
      } as ChatMessageType<'usernotice', 'rewardgift'>;
    }

    case 'raid': {
      return {
        ...baseMessage,
        badges: [],
        message: [],
        userstate,
        notice_tags: { ...tags, ...emptyFields },
        isSpecialNotice: true,
        ...emptyFields,
      } as ChatMessageType<'usernotice', 'raid'>;
    }

    default: {
      const rawSystem =
        typeof tags['system-msg'] === 'string' ? tags['system-msg'] : '';
      const systemLine = unescapeIrcTag(rawSystem);
      const userLine = text.trimEnd();
      const combined = [systemLine, userLine]
        .filter(Boolean)
        .join(systemLine && userLine ? ' ' : '');

      if (!combined) {
        return {
          ...baseMessage,
          userstate,
          badges: [],
          message: [],
          isSpecialNotice: true,
          ...emptyFields,
        } as ChatMessageType<'usernotice'>;
      }

      return {
        ...baseMessage,
        userstate,
        badges: [],
        message: [{ type: 'text' as const, content: combined }],
        isSpecialNotice: true,
        isTwitchSystemNotice: true,
        ...emptyFields,
      } as ChatMessageType<'usernotice'>;
    }
  }
};

export const createSystemMessage = (
  channelName: string,
  content: string,
): AnyChatMessageType => {
  const messageId = `system-${Date.now()}`;
  const messageNonce = generateNonce();

  return {
    id: `${messageId}_${messageNonce}`,
    userstate: {
      'display-name': 'System',
      login: 'system',
      username: 'System',
      'user-id': '',
      id: '',
      color: '#808080',
      badges: {},
      'badges-raw': '',
      'user-type': '',
      mod: '0',
      subscriber: '0',
      turbo: '0',
      'emote-sets': '',
      'reply-parent-msg-id': '',
      'reply-parent-msg-body': '',
      'reply-parent-display-name': '',
      'reply-parent-user-login': '',
    },
    message: [{ type: 'text', content }],
    badges: [],
    channel: channelName,
    message_id: messageId,
    message_nonce: messageNonce,
    sender: 'System',
    parentDisplayName: '',
    replyDisplayName: '',
    replyBody: '',
    parentColor: undefined,
    isSpecialNotice: true,
  };
};
