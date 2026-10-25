import { useMemo } from 'react';

import { CharityDonationNotice } from '@app/components/chat/components/user-notices/CharityDonationNotice';
import { ModAnniversaryNotice } from '@app/components/chat/components/user-notices/ModAnniversaryNotice';
import { RitualNotice } from '@app/components/chat/components/user-notices/RitualNotice';
import { SubscriptionNotice } from '@app/components/chat/components/user-notices/SubscriptionNotice';
import { ViewerMilestoneNotice } from '@app/components/chat/components/user-notices/ViewerMilestoneNotice';
import type { MessageToken } from '@app/utils/chat/messageToken';

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
            {...{ token, notice_tags: noticeTags, parsedMessage }}
          />
        );
      }

      return <SubscriptionNotice {...{ token, parsedMessage }} />;
    }

    case 'viewermilestone':
      return (
        <ViewerMilestoneNotice
          {...{
            compact,
            disableAnimations: disableEmoteAnimations,
            fontScale,
            parsedMessage,
            token,
          }}
        />
      );

    case 'modiversary':
      return (
        <ModAnniversaryNotice
          {...{
            compact,
            disableAnimations: disableEmoteAnimations,
            fontScale,
            parsedMessage,
            token,
          }}
        />
      );

    case 'charitydonation':
      return (
        <CharityDonationNotice
          {...{
            compact,
            disableAnimations: disableEmoteAnimations,
            fontScale,
            parsedMessage,
            token,
          }}
        />
      );

    case 'ritual':
      return (
        <RitualNotice
          {...{
            compact,
            disableAnimations: disableEmoteAnimations,
            fontScale,
            parsedMessage,
            token,
          }}
        />
      );

    default:
      return null;
  }
}
