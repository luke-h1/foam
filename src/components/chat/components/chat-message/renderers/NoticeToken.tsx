import { useMemo } from 'react';

import { CharityDonationNotice } from '@app/components/chat/components/user-notices/CharityDonationNotice';
import { ModAnniversaryNotice } from '@app/components/chat/components/user-notices/ModAnniversaryNotice';
import { RitualNotice } from '@app/components/chat/components/user-notices/RitualNotice';
import { SubscriptionNotice } from '@app/components/chat/components/user-notices/SubscriptionNotice';
import { ViewerMilestoneNotice } from '@app/components/chat/components/user-notices/ViewerMilestoneNotice';
import type { MessageToken } from '@app/types/chat/messageToken';
import { isSubscriptionNoticeToken } from '@app/utils/chat/subscription-notice-token-types';

import { parseMessageText } from '../util/parseMessageText';
import type { ChatTokenRenderProps } from './types/chat-token-render-props';

function getNoticeUserMessage(token: MessageToken): string | undefined {
  if (isSubscriptionNoticeToken(token)) {
    return token.subscriptionEvent.message;
  }

  switch (token.type) {
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
  density: ChatTokenRenderProps['density'];
  disableEmoteAnimations: ChatTokenRenderProps['disableEmoteAnimations'];
  fontScale: ChatTokenRenderProps['fontScale'];
  parseTextForEmotes: ChatTokenRenderProps['parseTextForEmotes'];
  token: MessageToken;
}

export function NoticeToken({
  density,
  disableEmoteAnimations,
  fontScale,
  parseTextForEmotes,
  token,
}: NoticeTokenProps) {
  const noticeMessage = getNoticeUserMessage(token);

  const messageTokens = useMemo(
    () => parseMessageText(noticeMessage, parseTextForEmotes),
    [noticeMessage, parseTextForEmotes],
  );

  if (isSubscriptionNoticeToken(token)) {
    return (
      <SubscriptionNotice
        {...{
          density,
          disableEmoteAnimations,
          fontScale,
          messageTokens,
          token,
        }}
      />
    );
  }

  switch (token.type) {
    case 'viewermilestone':
      return (
        <ViewerMilestoneNotice
          {...{
            density,
            disableEmoteAnimations,
            fontScale,
            messageTokens,
            token,
          }}
        />
      );

    case 'modiversary':
      return (
        <ModAnniversaryNotice
          {...{
            density,
            disableEmoteAnimations,
            fontScale,
            messageTokens,
            token,
          }}
        />
      );

    case 'charitydonation':
      return (
        <CharityDonationNotice
          {...{
            density,
            disableEmoteAnimations,
            fontScale,
            messageTokens,
            token,
          }}
        />
      );

    case 'ritual':
      return (
        <RitualNotice
          {...{
            density,
            disableEmoteAnimations,
            fontScale,
            messageTokens,
            token,
          }}
        />
      );

    default:
      return null;
  }
}
