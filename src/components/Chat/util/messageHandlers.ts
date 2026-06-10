import type {
  AnyChatMessageType,
  ChatMessageType,
} from '@app/store/chat/types/constants';
import {
  UserNoticeTags,
  UserNoticeTagsByVariant,
  ViewerMilestoneTags,
} from '@app/types/chat/irc-tags/usernotice';
import { UserStateTags } from '@app/types/chat/irc-tags/userstate';
import {
  createCharityDonationPart,
  createRitualPart,
  createSubscriptionPart,
  createViewerMilestonePart,
} from '@app/utils/chat/formatSubscriptionNotice';
import { parseBadges } from '@app/utils/chat/parseBadges';
import {
  isSharedChatDuplicatedNotice,
  isSubscriptionUserNotice,
} from '@app/utils/chat/userNoticeMsgIds';
import { isHighlightMyMessageTags } from '@app/utils/chat/channelPointsRewardTitle';
import {
  enrichChannelPointPrivmsgTags,
  ingestChannelPointRewardTags,
} from '@app/utils/chat/channelPointRewardTitleStore';
import { unescapeIrcTag } from '@app/utils/chat/unescapeIrcTag';
import { getPreferences } from '@app/store/preferenceStore';
import { formatDate } from '@app/utils/date-time/date';
import { generateNonce } from '@app/utils/string/generateNonce';

export type { AnyChatMessageType };

export function coerceUserNoticeTags(
  tags: Record<string, string>,
): UserNoticeTags {
  return tags as UserNoticeTags;
}

function toStringTagRecord(tags: UserNoticeTags): Record<string, string> {
  const result: Record<string, string> = {};

  for (const [key, value] of Object.entries(tags)) {
    if (typeof value === 'string') {
      result[key] = value;
    }
  }

  return result;
}

interface CreateBaseMessageParams {
  tags: Record<string, string>;
  channelName: string;
  text: string;
  broadcasterId?: string;
}

function createChatTimestamp(date: Date | number = Date.now()): string {
  const format =
    getPreferences().chatTimestampFormat === '12h' ? 'h:mm a' : 'HH:mm';
  return formatDate(date, format);
}

function createChatTimestampFromTags(tags: { 'tmi-sent-ts'?: string }): string {
  const sentTs = tags['tmi-sent-ts'];
  if (sentTs) {
    const parsed = Number.parseInt(sentTs, 10);
    if (Number.isFinite(parsed)) {
      return createChatTimestamp(parsed);
    }
  }

  return createChatTimestamp();
}

export const createUserStateFromTags = (
  tags: Record<string, string>,
): UserStateTags => {
  const badgeData = parseBadges(tags.badges);

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
  broadcasterId,
}: CreateBaseMessageParams): ChatMessageType<'usernotice'> => {
  const enrichedTags = enrichChannelPointPrivmsgTags(tags, broadcasterId);
  const userstate = createUserStateFromTags(enrichedTags);
  const messageId = userstate.id || '0';
  const messageNonce = messageId !== '0' ? messageId : generateNonce();
  const isHighlightedMessage = isHighlightMyMessageTags(enrichedTags);

  return {
    id: `${messageId}_${messageNonce}`,
    userstate,
    message: [{ type: 'text', content: text.trimEnd() }],
    badges: [],
    channel: channelName,
    message_id: messageId,
    message_nonce: messageNonce,
    timestamp: createChatTimestampFromTags(tags),
    sender: userstate.username || '',
    parentDisplayName: tags['reply-parent-display-name'] || '',
    replyDisplayName: tags['reply-parent-user-login'] || '',
    replyBody: unescapeIrcTag(tags['reply-parent-msg-body'] || ''),
    parentColor: undefined,
    isChannelPointRedemption:
      Boolean(enrichedTags['custom-reward-id']) || isHighlightedMessage,
    ...(isHighlightedMessage ? { isHighlightedMessage: true } : {}),
  };
};

const createSystemNoticeText = (tags: UserNoticeTags, text: string): string => {
  const rawSystem =
    typeof tags['system-msg'] === 'string' ? tags['system-msg'] : '';
  const systemLine = unescapeIrcTag(rawSystem);
  const userLine = text.trimEnd();

  return [systemLine, userLine]
    .filter(Boolean)
    .join(systemLine && userLine ? ' ' : '');
};

const createModiversaryText = (tags: UserNoticeTags, text: string): string => {
  const systemText = createSystemNoticeText(tags, text);
  if (systemText) {
    return systemText;
  }

  const displayName = tags['display-name'] || tags.login || '';
  const months =
    typeof tags['msg-param-months'] === 'string'
      ? tags['msg-param-months']
      : '';

  if (!displayName || !months) {
    return '';
  }

  return `${displayName}, thank you for protecting our community for ${months} months!`;
};

interface CreateUserNoticeParams {
  tags: UserNoticeTags;
  channelName: string;
  text: string;
  broadcasterId?: string;
}

export const createUserNoticeMessage = ({
  tags,
  channelName,
  text,
  broadcasterId,
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

  const { message: _droppedMessage, ...userstateTags } =
    userstate as UserStateTags & { message?: unknown };

  const tagId = 'id' in tags ? (tags as { id?: string }).id : undefined;
  const messageId = tagId || generateNonce();

  const baseMessage = {
    id: `${messageId}_${messageNonce}`,
    message: [{ type: 'text' as const, content: text.trimEnd() }],
    badges: {},
    channel: channelName,
    message_id: messageId,
    message_nonce: messageNonce,
    timestamp: createChatTimestampFromTags(tags),
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
    ...userstateTags,
  };

  const emptyFields = {
    sender: '',
    replyDisplayName: '',
    replyBody: '',
    channel: '',
    parentDisplayName: '',
  };

  const sharedChatDuplicated = isSharedChatDuplicatedNotice(tags);
  const sharedChatFields = sharedChatDuplicated
    ? { isSharedChatDuplicated: true as const }
    : {};

  const createSubscriptionNoticeMessage = (): AnyChatMessageType =>
    ({
      ...baseMessage,
      badges: [],
      message: [createSubscriptionPart(tags, text)],
      userstate,
      notice_tags: { ...tags, ...emptyFields } as UserNoticeTags,
      isSpecialNotice: true,
      ...sharedChatFields,
      ...emptyFields,
    }) as AnyChatMessageType;

  const createMetadataUserNoticeMessage = (options: {
    isAnnouncement?: boolean;
    isChannelPointRedemption?: boolean;
    isHighlightedMessage?: boolean;
  }): AnyChatMessageType => {
    const metadataUserstate = createUserStateFromTags(toStringTagRecord(tags));
    const trimmedText = text.trimEnd();

    return {
      ...baseMessage,
      userstate: metadataUserstate,
      sender: metadataUserstate.username || metadataUserstate.login || '',
      badges: [],
      message: trimmedText
        ? [{ type: 'text' as const, content: trimmedText }]
        : [],
      notice_tags: { ...tags, ...emptyFields } as UserNoticeTags,
      isSpecialNotice: true,
      ...options,
      ...sharedChatFields,
      replyDisplayName: '',
      replyBody: '',
      parentDisplayName: '',
    } as AnyChatMessageType;
  };

  const createSystemUserNoticeMessage = (): AnyChatMessageType => {
    const combined = createSystemNoticeText(tags, text);

    return {
      ...baseMessage,
      userstate,
      badges: [],
      message: combined ? [{ type: 'text' as const, content: combined }] : [],
      notice_tags: { ...tags, ...emptyFields } as UserNoticeTags,
      isSpecialNotice: true,
      isTwitchSystemNotice: true,
      ...sharedChatFields,
      ...emptyFields,
    } as AnyChatMessageType;
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
      };
    }

    case 'resub':
    case 'sub':
    case 'subgift':
    case 'submysterygift':
    case 'giftpaidupgrade':
    case 'anongiftpaidupgrade':
    case 'primepaidupgrade':
    case 'extendsub':
    case 'standardpayforward':
    case 'communitypayforward':
    case 'primecommunitygiftreceived':
    case 'anonsubgift':
    case 'anonsubmysterygift': {
      return createSubscriptionNoticeMessage();
    }

    case 'charitydonation': {
      return {
        ...baseMessage,
        badges: [],
        message: [createCharityDonationPart(tags, text)],
        userstate,
        notice_tags: { ...tags, ...emptyFields } as UserNoticeTags,
        isSpecialNotice: true,
        ...sharedChatFields,
        ...emptyFields,
      } as AnyChatMessageType;
    }

    case 'ritual': {
      return {
        ...baseMessage,
        badges: [],
        message: [createRitualPart(tags, text)],
        userstate,
        notice_tags: { ...tags, ...emptyFields } as UserNoticeTags,
        isSpecialNotice: true,
        ...sharedChatFields,
        ...emptyFields,
      } as AnyChatMessageType;
    }

    case 'highlighted-message': {
      return createMetadataUserNoticeMessage({
        isHighlightedMessage: true,
        isChannelPointRedemption: true,
      });
    }

    case 'rewardgift': {
      ingestChannelPointRewardTags(tags, broadcasterId);
      const trimmedText = text.trimEnd();

      if (!trimmedText) {
        return createSystemUserNoticeMessage();
      }

      return {
        ...baseMessage,
        badges: [],
        message: [{ type: 'text' as const, content: trimmedText }],
        userstate,
        notice_tags: { ...tags, ...emptyFields } as UserNoticeTags,
        isChannelPointRedemption: true,
      } as ChatMessageType<'usernotice', 'rewardgift'>;
    }

    case 'raid': {
      return createSystemUserNoticeMessage();
    }

    case 'modiversary': {
      const combined = createModiversaryText(tags, text);

      return {
        ...baseMessage,
        userstate,
        badges: [],
        message: combined ? [{ type: 'text' as const, content: combined }] : [],
        notice_tags: {
          ...tags,
          ...emptyFields,
        } as UserNoticeTagsByVariant<'modiversary'>,
        isSpecialNotice: true,
        isTwitchSystemNotice: true,
        ...sharedChatFields,
        ...emptyFields,
      } as AnyChatMessageType;
    }

    case 'announcement': {
      return createMetadataUserNoticeMessage({ isAnnouncement: true });
    }

    case 'skip-subs-mode-message':
    case 'midnightsquid':
    case 'unraid':
    case 'bitsbadgetier':
    case 'sharedchatnotice': {
      return createSystemUserNoticeMessage();
    }

    default: {
      if (isSubscriptionUserNotice(tags['msg-id'])) {
        return createSubscriptionNoticeMessage();
      }

      const combined = createSystemNoticeText(tags, text);

      if (!combined) {
        return {
          ...baseMessage,
          userstate,
          badges: [],
          message: [],
          isSpecialNotice: true,
          ...emptyFields,
        };
      }

      return {
        ...baseMessage,
        userstate,
        badges: [],
        message: [{ type: 'text' as const, content: combined }],
        isSpecialNotice: true,
        isTwitchSystemNotice: true,
        ...sharedChatFields,
        ...emptyFields,
      };
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
    timestamp: createChatTimestamp(),
    sender: 'System',
    parentDisplayName: '',
    replyDisplayName: '',
    replyBody: '',
    parentColor: undefined,
    isSpecialNotice: true,
  };
};
