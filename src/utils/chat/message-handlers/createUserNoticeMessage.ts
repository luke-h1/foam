import type { AnyChatMessageType } from '@app/types/chat/chatMessage';
import type { ChatTimestampFormat } from '@app/types/chat/chatTimestampFormat';
import type {
  UserNoticeTags,
  UserNoticeTagsByVariant,
  ViewerMilestoneTags,
} from '@app/types/chat/irc-tags/usernotice';
import { createCharityDonationToken } from '@app/utils/chat/format-subscription-notice/createCharityDonationToken';
import { createModiversaryToken } from '@app/utils/chat/format-subscription-notice/createModiversaryToken';
import { createRitualToken } from '@app/utils/chat/format-subscription-notice/createRitualToken';
import { createSubscriptionToken } from '@app/utils/chat/format-subscription-notice/createSubscriptionToken';
import { createViewerMilestoneToken } from '@app/utils/chat/format-subscription-notice/createViewerMilestoneToken';
import { hasRenderableNoticeBody } from '@app/utils/chat/format-subscription-notice/hasRenderableNoticeBody';
import { createMessageIdentity } from '@app/utils/chat/message-identity/createMessageIdentity';
import { isSharedChatDuplicatedNotice } from '@app/utils/chat/user-notice-msg-ids/isSharedChatDuplicatedNotice';
import {
  isSubscriptionUserNotice,
  type SubscriptionUserNoticeTags,
} from '@app/utils/chat/user-notice-msg-ids/isSubscriptionUserNotice';
import { generateNonce } from '@app/utils/string/generateNonce';

import { createChatTimestampFromTags } from './createChatTimestampFromTags';
import { createUserStateFromTags } from './createUserStateFromTags';
import { getReplyFields } from './getReplyFields';

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
  timestampFormat: ChatTimestampFormat;
}

export const createUserNoticeMessage = ({
  tags,
  channelName,
  text,
  timestampFormat,
}: CreateUserNoticeParams): AnyChatMessageType => {
  const messageId = tags.id || generateNonce();
  const messageNonce = messageId;
  const userstate = createUserStateFromTags(tags);
  const sharedChatFields: Pick<AnyChatMessageType, 'isSharedChatDuplicated'> =
    {};

  if (isSharedChatDuplicatedNotice(tags)) {
    sharedChatFields.isSharedChatDuplicated = true;
  }

  const baseMessage = {
    ...createMessageIdentity(messageId, messageNonce),
    badges: [],
    channel: channelName,
    timestamp: createChatTimestampFromTags(tags, timestampFormat),
    sender: userstate.username || '',
    userstate,
    ...getReplyFields(tags),
    ...sharedChatFields,
  };

  const createSubscriptionNoticeMessage = (
    subscriptionTags: SubscriptionUserNoticeTags,
  ): AnyChatMessageType => ({
    ...baseMessage,
    message: [createSubscriptionToken(subscriptionTags, text)],
    notice_tags: tags,
    isSpecialNotice: true,
  });

  const createMetadataUserNoticeMessage = (options: {
    isAnnouncement?: boolean;
    isChannelPointRedemption?: boolean;
    isHighlightedMessage?: boolean;
  }): AnyChatMessageType => {
    const trimmedText = text.trimEnd();

    return {
      ...baseMessage,
      message: trimmedText
        ? [{ type: 'text' as const, content: trimmedText }]
        : [],
      notice_tags: tags,
      isSpecialNotice: true,
      ...options,
      replyParentLogin: '',
      replyBody: '',
      parentDisplayName: '',
    };
  };

  const createSystemUserNoticeMessage = (): AnyChatMessageType => {
    const combined = createSystemNoticeText(tags, text);

    return {
      ...baseMessage,
      message: combined ? [{ type: 'text' as const, content: combined }] : [],
      notice_tags: tags,
      isSpecialNotice: true,
      isTwitchSystemNotice: true,
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

      const milestonePart = createViewerMilestoneToken(
        viewerMilestoneTags,
        text,
      );

      return {
        ...baseMessage,
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

    case 'charitydonation': {
      return {
        ...baseMessage,
        message: [createCharityDonationToken(tags, text)],
        notice_tags: tags,
        isSpecialNotice: true,
      };
    }

    case 'ritual': {
      return {
        ...baseMessage,
        message: [createRitualToken(tags, text)],
        notice_tags: tags,
        isSpecialNotice: true,
      };
    }

    case 'highlighted-message': {
      return createMetadataUserNoticeMessage({
        isHighlightedMessage: true,
        isChannelPointRedemption: true,
      });
    }

    case 'rewardgift': {
      const trimmedText = text.trimEnd();

      if (!trimmedText) {
        return createSystemUserNoticeMessage();
      }

      return {
        ...baseMessage,
        message: [{ type: 'text' as const, content: trimmedText }],
        notice_tags: tags,
        isChannelPointRedemption: true,
      };
    }

    case 'raid': {
      return createSystemUserNoticeMessage();
    }

    case 'modiversary': {
      const modiversaryPart = createModiversaryToken(tags, text);

      return {
        ...baseMessage,
        message: [modiversaryPart].filter(hasRenderableNoticeBody),
        notice_tags: tags,
        isSpecialNotice: true,
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
        return createSubscriptionNoticeMessage(tags);
      }

      const combined = createSystemNoticeText(tags, text);

      if (!combined) {
        return {
          ...baseMessage,
          message: [],
          isSpecialNotice: true,
        };
      }

      return {
        ...baseMessage,
        message: [{ type: 'text' as const, content: combined }],
        isSpecialNotice: true,
        isTwitchSystemNotice: true,
      };
    }
  }
};
