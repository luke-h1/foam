import type { AnyChatMessageType } from '@app/store/chat/types/constants';
import type {
  UserNoticeTags,
  UserNoticeTagsByVariant,
  ViewerMilestoneTags,
} from '@app/types/chat/irc-tags/usernotice';
import { ingestChannelPointRewardTags } from '@app/utils/chat/channelPointRewardTitleStore';
import { createCharityDonationPart } from '@app/utils/chat/format-subscription-notice/createCharityDonationToken';
import { createModiversaryPart } from '@app/utils/chat/format-subscription-notice/createModiversaryToken';
import { createRitualPart } from '@app/utils/chat/format-subscription-notice/createRitualToken';
import { createSubscriptionPart } from '@app/utils/chat/format-subscription-notice/createSubscriptionToken';
import { createViewerMilestonePart } from '@app/utils/chat/format-subscription-notice/createViewerMilestoneToken';
import { getTagValue } from '@app/utils/chat/format-subscription-notice/getTagValue';
import { hasRenderableNoticeBody } from '@app/utils/chat/format-subscription-notice/hasRenderableNoticeBody';
import { isSharedChatDuplicatedNotice } from '@app/utils/chat/user-notice-msg-ids/isSharedChatDuplicatedNotice';
import { isSubscriptionUserNotice } from '@app/utils/chat/user-notice-msg-ids/isSubscriptionUserNotice';
import { generateNonce } from '@app/utils/string/generateNonce';

import { createChatTimestampFromTags } from './createChatTimestampFromTags';
import { createUserStateFromTags } from './createUserStateFromTags';

function toStringTagRecord(tags: UserNoticeTags) {
  const result: Record<string, string> = {};

  for (const [key, value] of Object.entries(tags)) {
    if (value === true || value === false || value === undefined) {
      continue;
    }

    result[key] = value;
  }

  return result;
}

const createSystemNoticeText = (tags: UserNoticeTags, text: string): string => {
  const systemLine = tags['system-msg'] ?? '';
  const userLine = text.trimEnd();

  return [systemLine, userLine]
    .filter(Boolean)
    .join(systemLine && userLine ? ' ' : '');
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
  const userstate = createUserStateFromTags(toStringTagRecord(tags));
  const messageId = tags.id || generateNonce();

  const baseMessage = {
    id: `${messageId}_${messageNonce}`,
    message: [{ type: 'text' as const, content: text.trimEnd() }],
    badges: {},
    channel: channelName,
    message_id: messageId,
    message_nonce: messageNonce,
    timestamp: createChatTimestampFromTags(tags),
    sender: userstate.username || '',
    parentDisplayName: getTagValue(tags, 'reply-parent-display-name'),
    replyDisplayName: getTagValue(tags, 'reply-parent-user-login'),
    replyBody: getTagValue(tags, 'reply-parent-msg-body'),
  };

  const sharedChatDuplicated = isSharedChatDuplicatedNotice(tags);

  const sharedChatFields = sharedChatDuplicated
    ? { isSharedChatDuplicated: true as const }
    : {};

  const createSubscriptionNoticeMessage = (): AnyChatMessageType => ({
    ...baseMessage,
    badges: [],
    message: [createSubscriptionPart(tags, text)],
    userstate,
    notice_tags: tags,
    isSpecialNotice: true,
    ...sharedChatFields,
  });

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
      notice_tags: tags,
      isSpecialNotice: true,
      ...options,
      ...sharedChatFields,
      replyDisplayName: '',
      replyBody: '',
      parentDisplayName: '',
    };
  };

  const createSystemUserNoticeMessage = (): AnyChatMessageType => {
    const combined = createSystemNoticeText(tags, text);

    return {
      ...baseMessage,
      userstate,
      badges: [],
      message: combined ? [{ type: 'text' as const, content: combined }] : [],
      notice_tags: tags,
      isSpecialNotice: true,
      isTwitchSystemNotice: true,
      ...sharedChatFields,
    };
  };

  switch (tags['msg-id']) {
    case 'viewermilestone': {
      const viewerMilestoneTags: ViewerMilestoneTags = {
        'msg-id': 'viewermilestone',
        'msg-param-category': tags['msg-param-category'] ?? 'watch-streak',
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

      const milestonePart = createViewerMilestonePart(
        viewerMilestoneTags,
        text,
      );

      return {
        ...baseMessage,
        replyDisplayName: getTagValue(tags, 'reply-parent-display-name'),
        replyBody: '',
        badges: [],
        userstate,
        message: [milestonePart].filter(hasRenderableNoticeBody),
        notice_tags: {
          'msg-id': tags['msg-id'],
          'msg-param-category': tags['msg-param-category'],
          'msg-param-copoReward': tags['msg-param-copoReward'] ?? '',
          'msg-param-id': tags['msg-param-id'] ?? '',
          'msg-param-value': tags['msg-param-value'] ?? '',
          'badge-info': tags['badge-info'] ?? '',
          'display-name': tags['display-name'] ?? '',
          'system-msg': tags['system-msg'] ?? '',
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
        notice_tags: tags,
        isSpecialNotice: true,
        ...sharedChatFields,
      };
    }

    case 'ritual': {
      return {
        ...baseMessage,
        badges: [],
        message: [createRitualPart(tags, text)],
        userstate,
        notice_tags: tags,
        isSpecialNotice: true,
        ...sharedChatFields,
      };
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
        notice_tags: tags,
        isChannelPointRedemption: true,
      };
    }

    case 'raid': {
      return createSystemUserNoticeMessage();
    }

    case 'modiversary': {
      const modiversaryPart = createModiversaryPart(tags, text);

      return {
        ...baseMessage,
        userstate,
        badges: [],
        message: [modiversaryPart].filter(hasRenderableNoticeBody),
        notice_tags: tags,
        isSpecialNotice: true,
        ...sharedChatFields,
      };
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
      };
    }
  }
};
