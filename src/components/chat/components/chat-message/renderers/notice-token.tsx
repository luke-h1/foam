import { useMemo } from 'react';

import { CharityDonationNotice } from '@app/components/chat/components/user-notices/charity-donation-notice';
import { ModAnniversaryNotice } from '@app/components/chat/components/user-notices/mod-anniversary-notice';
import { RitualNotice } from '@app/components/chat/components/user-notices/ritual-notice';
import { SubscriptionNotice } from '@app/components/chat/components/user-notices/subscription-notice';
import { ViewerMilestoneNotice } from '@app/components/chat/components/user-notices/viewer-milestone-notice';
import type { MessageToken } from '@app/utils/chat/message-token';

import type { ChatTokenRenderProps } from './types/chat-token-render-props';

function getNoticeUserMessage(token: MessageToken): string | undefined {
  switch (token.type) {
    case 'sub':
    case 'resub':
    case 'anongift':
    case 'anongiftpaidupgrade':
    case 'submysterygift':
    case 'giftpaidupgrade':
    case 'primepaidupgrade':
      return token.subscriptionEvent.message;
    case 'charitydonation':
    case 'ritual':
      return token.message;
    case 'viewermilestone':
    case 'modiversary':
      return token.content;
    default:
      return undefined;
  }
}

interface NoticeTokenProps {
  compact: ChatTokenRenderProps['compact'];
  disableEmoteAnimations: ChatTokenRenderProps['disableEmoteAnimations'];
  fontScale: ChatTokenRenderProps['fontScale'];
  noticeTags: ChatTokenRenderProps['noticeTags'];
  parseTextForEmotes: ChatTokenRenderProps['parseTextForEmotes'];
  token: MessageToken;
}

/**
 * Every usernotice token type. They all read the same four props, so the parent
 * dispatches anything it does not render itself to here.
 */
export function NoticeToken({
  compact,
  disableEmoteAnimations,
  fontScale,
  noticeTags,
  parseTextForEmotes,
  token,
}: NoticeTokenProps) {
  const noticeMessage = getNoticeUserMessage(token);

  const parsedMessage = useMemo(
    () =>
      noticeMessage && parseTextForEmotes
        ? parseTextForEmotes(noticeMessage)
        : undefined,
    [noticeMessage, parseTextForEmotes],
  );

  switch (token.type) {
    case 'sub':
    case 'resub':
    case 'submysterygift':
    case 'giftpaidupgrade':
    case 'anongiftpaidupgrade':
    case 'anongift':
    case 'primepaidupgrade': {
      if (noticeTags) {
        return (
          <SubscriptionNotice
            token={token}
            notice_tags={noticeTags}
            parsedMessage={parsedMessage}
          />
        );
      }

      return <SubscriptionNotice token={token} parsedMessage={parsedMessage} />;
    }

    case 'viewermilestone':
      return (
        <ViewerMilestoneNotice
          compact={compact}
          disableAnimations={disableEmoteAnimations}
          fontScale={fontScale}
          parsedMessage={parsedMessage}
          token={token}
        />
      );

    case 'modiversary':
      return (
        <ModAnniversaryNotice
          compact={compact}
          disableAnimations={disableEmoteAnimations}
          fontScale={fontScale}
          parsedMessage={parsedMessage}
          token={token}
        />
      );

    case 'charitydonation':
      return (
        <CharityDonationNotice
          compact={compact}
          disableAnimations={disableEmoteAnimations}
          fontScale={fontScale}
          parsedMessage={parsedMessage}
          token={token}
        />
      );

    case 'ritual':
      return (
        <RitualNotice
          compact={compact}
          disableAnimations={disableEmoteAnimations}
          fontScale={fontScale}
          parsedMessage={parsedMessage}
          token={token}
        />
      );

    default:
      return null;
  }
}
