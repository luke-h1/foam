import { ingestChannelPointRewardTags } from '@app/store/chat/actions/channelPointRewardTitles';
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
import { createCharityDonationPart } from '@app/utils/chat/formatSubscriptionNotice/createCharityDonationPart';
import { createRitualPart } from '@app/utils/chat/formatSubscriptionNotice/createRitualPart';
import { createSubscriptionPart } from '@app/utils/chat/formatSubscriptionNotice/createSubscriptionPart';
import { createViewerMilestonePart } from '@app/utils/chat/formatSubscriptionNotice/createViewerMilestonePart';
import { isSharedChatDuplicatedNotice } from '@app/utils/chat/userNoticeMsgIds/isSharedChatDuplicatedNotice';
import { isSubscriptionUserNotice } from '@app/utils/chat/userNoticeMsgIds/isSubscriptionUserNotice';
import { generateNonce } from '@app/utils/string/generateNonce';

import { createChatTimestampFromTags } from './createChatTimestampFromTags';
import { createUserStateFromTags } from './createUserStateFromTags';

function toStringTagRecord(tags: UserNoticeTags): Record<string, string> {
  const result: Record<string, string> = {};

  for (const [key, value] of Object.entries(tags)) {
    if (typeof value === 'string') {
      result[key] = value;
    }
  }

  return result;
}

const createSystemNoticeText = (tags: UserNoticeTags, text: string): string => {
  const systemLine =
    typeof tags['system-msg'] === 'string' ? tags['system-msg'] : '';
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
    replyBody:
      typeof tags['reply-parent-msg-body'] === 'string'
        ? tags['reply-parent-msg-body']
        : '',
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
